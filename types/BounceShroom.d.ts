type BounceShroom = Model & {
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
}
