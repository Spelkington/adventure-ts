import { KnitServer as Knit, Component } from "@rbxts/knit";
import { ServerScriptService } from "@rbxts/services";

Knit.Start();

// Auto-load all server-side components
Component.Auto(ServerScriptService.TS.Components);
