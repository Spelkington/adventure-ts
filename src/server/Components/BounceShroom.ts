import { KnitServer as Knit, Component, Janitor, Timer } from "@rbxts/knit";
import { Workspace } from "@rbxts/services";
import { Vector } from "ts-matrix";

type BounceShroomModel = Model & {
	Markers: Model & {
		Anchor: Part;
		Destination: Part;
	};
	Configuration: Configuration & {
		Debug: BoolValue;
		Height: IntValue;
	};
	MushroomModel: Model & {
		Stem: Model & {
			StemPart: Part;
		};
		Launcher: Part;
		Head: Model;
	};
};

class BounceShroom implements Component.ComponentClass {
	public static Tag = "BounceShroom";
	private static DIVE_TILT = -math.pi / 4;
	private static USERCONTROL_VELOCITY = 0;
	private static LAUNCH_TIME = 0.1;
	private static FALLCHECK_TIME = 0.5;
	private static DEBOUNCE_TIME = 1;
	private static SPIN_DAMPEN = math.pi / 6;
	private static SPIN_MAX = math.pi * 8;
	private static VELOCITY_ADJ = 0.75;

	private janitor = new Janitor();
	private debounce: Set<Model> = new Set<Model>();
	private model: BounceShroomModel;
	private mushroom;
	private markers;
	private angle = 0;
	private velocity = 0;

	/**
	 * Construct a new DanceFloor object.
	 *
	 * @param instance The Model instance tagged DanceFloor
	 */
	constructor(instance: Instance) {
		assert(instance.IsA("Model"));
		this.model = <BounceShroomModel>instance;
		this.mushroom = this.model.MushroomModel;
		this.markers = this.model.Markers;

		this.setPhysics();

		this.janitor.Add(this.model);

		this.janitor.Add(
			this.mushroom.Launcher.Touched.Connect((part) => {
				this.onTouched(part);
			}),
		);

		print(
			`BounceShroom at ${this.mushroom.Launcher.Position.X}, ${this.mushroom.Launcher.Position.Y} initialized!`,
		);
	}

	private setPhysics() {
		const destination = this.markers.Destination;
		const anchor = this.markers.Anchor;
		const launcher = this.mushroom.Launcher;
		const debug = this.model.Configuration.Debug.Value;

		// Getting parabola positions
		const x1 = launcher.Position.X;
		const y1 = launcher.Position.Y;
		const x2 = anchor.Position.X;
		const y2 = anchor.Position.Y;
		const x3 = destination.Position.X;
		const y3 = destination.Position.Y;

		// Calculating a parabola given three points - origin, vertex, and destination.
		// from https://stackoverflow.com/questions/717762/how-to-calculate-the-vertex-of-a-parabola-given-three-points
		const denom = (x1 - x2) * (x1 - x3) * (x2 - x3);
		const a = (x3 * (y2 - y1) + x2 * (y1 - y3) + x1 * (y3 - y2)) / denom;
		const b = (x3 * x3 * (y1 - y2) + x2 * x2 * (y3 - y1) + x1 * x1 * (y2 - y3)) / denom;
		const c = (x2 * x3 * (x2 - x3) * y1 + x3 * x1 * (x3 - x1) * y2 + x1 * x2 * (x1 - x2) * y3) / denom;

		// Calculate vertex coordinates
		const x_vert = -b / (2 * a);
		const y_vert = c - (b * b) / (4 * a);

		// Finalize physics predictions
		const gravity = -1 * Workspace.Gravity;
		const y_dist = y_vert - y1;
		const x_dist = x_vert - x1 * 2;

		const timeInAir = math.sqrt((-2 * y_dist) / gravity);
		const x_vel = math.abs(x_dist) / timeInAir;
		const y_vel = -1 * gravity * timeInAir;
		this.velocity = math.sqrt(x_vel * x_vel + y_vel * y_vel) * BounceShroom.VELOCITY_ADJ;
		this.angle = math.sign(x_dist) * math.tan(x_vel / y_vel) + math.pi / 16;

		// Cleanup
		if (!debug) {
			destination.Destroy();
			anchor.Destroy();
		} else {
			const x_step = math.sign(x_dist) * 5;
			for (let x_marker = x1; x_marker < x3; x_marker += x_step) {
				// Calculate marker X and Y
				const y_marker = a * x_marker * x_marker + b * x_marker + c;
				const z_marker = anchor.Position.Z;

				// Create marker
				const marker = anchor.Clone();
				marker.Parent = anchor.Parent;
				marker.Position = new Vector3(x_marker, y_marker, z_marker);
			}
		}

		const newCFrame = this.model.GetPivot();

		print(this.angle);
		this.mushroom.PivotTo(newCFrame.mul(CFrame.fromOrientation(0, 0, this.angle - math.pi / 2)));
	}

	private onTouched(part: BasePart) {
		// Confirm that the actor is a model containing a humanoid, and is not currently in debounce
		if (part.Parent!.IsA("Model") && part.Parent.FindFirstChild("Humanoid") && !this.debounce.has(part.Parent)) {
			// Track the actor in debounce and launch it
			const actor = <Model>part.Parent;
			this.debounce.add(actor);
			this.launchActor(actor);
			this.debounce.delete(actor);
		}
	}

	private launchActor(actor: Model) {
		// Humanoid is verified pre-call, so we can assume it has one.
		const humanoid: Humanoid = <Humanoid>actor.FindFirstChild("Humanoid")!;
		// Try to find the primary part - fall back to HRP or first basepart
		const rootPart: BasePart = <BasePart>(
			(actor.PrimaryPart ?? actor.FindFirstChild("HumanoidRootPart") ?? actor.FindFirstChildOfClass("BasePart")!)
		);
		const upVector = this.mushroom.Launcher.CFrame.UpVector;

		// Choose the dive direction based on the tilt of the launch
		let diveDirection = 0;
		if (upVector.X > 0) {
			diveDirection = math.pi + BounceShroom.DIVE_TILT * 2;
		}

		// Immobilize the player and warp them to the top of the launcher
		humanoid.PlatformStand = true;
		rootPart.CFrame = this.mushroom.Launcher.CFrame.mul(
			CFrame.Angles(0, math.pi / 2 - BounceShroom.DIVE_TILT + diveDirection, 0),
		).add(upVector.mul(3));

		// Create new force to launch the player
		const launchForce = new Instance("BodyVelocity");
		launchForce.Parent = rootPart;
		launchForce.MaxForce = new Vector3(math.huge, math.huge, math.huge);
		launchForce.Velocity = upVector.mul(this.velocity);

		// Create new force to spin the player during launch
		const spinForce = new Instance("BodyAngularVelocity");
		spinForce.Parent = rootPart;
		spinForce.MaxTorque = new Vector3(math.huge, math.huge, math.huge);
		spinForce.AngularVelocity = upVector.mul(
			math.min(BounceShroom.SPIN_MAX, this.velocity / BounceShroom.SPIN_DAMPEN),
		);

		wait(BounceShroom.LAUNCH_TIME);
		launchForce.Destroy();
		spinForce.Destroy();

		wait(BounceShroom.FALLCHECK_TIME);
		while (rootPart.AssemblyLinearVelocity.Y > BounceShroom.USERCONTROL_VELOCITY) {
			wait(0.1);
		}

		humanoid.PlatformStand = false;
	}

	/**
	 * Clean up resources if the DanceFloor is destroyed.
	 */
	public Destroy() {
		this.janitor.Destroy();
	}
}

export = BounceShroom;
