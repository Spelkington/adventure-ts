import { KnitServer as Knit, Component, Janitor, Timer } from "@rbxts/knit";
import { Workspace } from "@rbxts/services";
import { Vector } from "ts-matrix";

type BounceShroomModel = Model & {
	Anchor: Part;
	Destination: Part;
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

	private janitor = new Janitor();
	private debounce: Set<Model> = new Set<Model>();
	private model: BounceShroomModel;
	private mushroom;
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

		this.setPhysics();

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
		const destination = this.model.Destination;
		const anchor = this.model.Anchor;
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
		if (debug) {
			anchor.Position = new Vector3(x_vert, y_vert, 0);
		}

		// Finalize physics predictions
		const gravity = -1 * Workspace.Gravity;
		const y_dist = y_vert - y1;
		const x_dist = math.abs(x_vert - x1) * 2;

		const timeInAir = math.sqrt((-2 * y_dist) / gravity);
		const x_vel = x_dist / timeInAir;
		const y_vel = -1 * gravity * timeInAir;
		this.velocity = math.sqrt(x_vel * x_vel + y_vel * y_vel);
		this.angle = math.tan(x_vel / y_vel);

		// Cleanup
		if (!debug) {
			destination.Destroy();
			anchor.Destroy();
		} else {
			destination.Parent = Workspace;
			anchor.Parent = Workspace;
			this.janitor.Add(destination);
			this.janitor.Add(anchor);
		}

		const newCFrame = this.model.GetPivot();

		this.model.PivotTo(newCFrame.mul(CFrame.fromOrientation(0, 0, this.angle - math.pi / 2)));
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
		print(actor);
		wait(1);
	}

	/**
	 * Clean up resources if the DanceFloor is destroyed.
	 */
	public Destroy() {
		this.janitor.Destroy();
	}
}

export = BounceShroom;
