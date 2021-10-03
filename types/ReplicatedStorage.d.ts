interface ReplicatedStorage extends Instance {
	TS: Folder & {
		FunctionLibrary: ModuleScript;
	};
	rbxts_include: Folder & {
		RuntimeLib: ModuleScript;
		Promise: ModuleScript;
		node_modules: Folder & {
			services: ModuleScript;
			knit: Folder & {
				Knit: ModuleScript & {
					KnitServer: ModuleScript;
					Version: StringValue;
					Util: Folder & {
						Promise: ModuleScript;
						Streamable: ModuleScript;
						Option: ModuleScript;
						Ser: ModuleScript;
						Remote: Folder & {
							RemoteProperty: ModuleScript;
							RemoteSignal: ModuleScript;
							ClientRemoteProperty: ModuleScript;
							ClientRemoteSignal: ModuleScript;
						};
						Timer: ModuleScript;
						Component: ModuleScript;
						StreamableUtil: ModuleScript;
						EnumList: ModuleScript;
						Loader: ModuleScript;
						Janitor: ModuleScript;
						Symbol: ModuleScript;
						TableUtil: ModuleScript;
						Signal: ModuleScript;
					};
					KnitClient: ModuleScript;
				};
			};
			["compiler-types"]: Folder & {
				types: Folder;
			};
			types: Folder & {
				include: Folder & {
					generated: Folder;
				};
			};
		};
	};
}
