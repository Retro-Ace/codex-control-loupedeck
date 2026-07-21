namespace Loupedeck.CodexControlWheelPlugin;

public sealed class CodexControlWheelApplication : ClientApplication
{
    protected override string GetProcessName() => string.Empty;

    protected override string GetBundleName() => string.Empty;

    public override ClientApplicationStatus GetApplicationStatus() => ClientApplicationStatus.Unknown;
}
