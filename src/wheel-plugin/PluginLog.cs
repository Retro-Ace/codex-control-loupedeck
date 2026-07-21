namespace Loupedeck.CodexControlWheelPlugin;

internal static class PluginLog
{
    private static PluginLogFile? logFile;

    public static void Init(PluginLogFile pluginLogFile) => logFile = pluginLogFile;

    public static void Error(Exception exception, string text) => logFile?.Error(exception, text);
}
