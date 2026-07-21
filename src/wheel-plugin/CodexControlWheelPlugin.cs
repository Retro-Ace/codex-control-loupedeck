namespace Loupedeck.CodexControlWheelPlugin;

public sealed class CodexControlWheelPlugin : Plugin
{
    public override bool UsesApplicationApiOnly => true;

    public override bool HasNoApplication => true;

    public CodexControlWheelPlugin()
    {
        PluginLog.Init(this.Log);
    }

    public override void Load()
    {
    }

    public override void Unload()
    {
    }
}
