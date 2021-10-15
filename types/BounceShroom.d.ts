type BounceShroom = Model & {
	MushroomModel: Model & {
		Stem: Model & {
			StemPart: Part;
		};
		Launcher: Part;
		Head: Model;
	};
	Configuration: Configuration & {
		Debug: BoolValue;
		CustomVelocity: BoolValue & {
			Underhand: BoolValue;
			Velocity: NumberValue;
		};
	};
	Markers: Model & {
		Destination: Part;
	};
};
