namespace Loupedeck.CodexControlWheelPlugin;

using System.Reflection;
using System.Threading;
using Loupedeck.Devices.Loupedeck2Devices;

public sealed class CodexControlReasoningWheel : WheelTool
{
    public const string TemplateId = "CodexControlReasoningWheel";
    private const string AdjustmentParameter = "adjustment";
    private const int PulseDurationMs = 220;

    private readonly object stateLock = new();
    private Timer? pulseTimer;
    private bool pulseActive;

    public CodexControlReasoningWheel()
        : base(TemplateId, "Codex Control Wheel")
    {
        this.TemplateDescription = "Full-wheel Codex reasoning control";
    }

    public override void SetDefaultParameters(Dictionary<string, string> parameters)
    {
        base.SetDefaultParameters(parameters);
        parameters[AdjustmentParameter] = string.Empty;
    }

    protected override BitmapImage CreateImage()
    {
        return this.CreateWheelImage(this.IsPulseActive());
    }

    protected override BitmapImage CreateDemoImage()
    {
        return this.CreateWheelImage(false);
    }

    protected override void OnEncoderEvent(DeviceEncoderEvent deviceEvent)
    {
        var adjustment = this.GetParameter(AdjustmentParameter, string.Empty);
        if (!string.IsNullOrWhiteSpace(adjustment) && deviceEvent.Clicks != 0)
        {
            this.ExecuteAction(adjustment, deviceEvent.Clicks);
            this.ShowPulse();
        }
    }

    protected override void OnTouchEvent(DeviceTouchEvent touchEvent)
    {
        if (touchEvent.EventType != DeviceTouchEventType.Tap)
        {
            return;
        }

        var adjustment = this.GetParameter(AdjustmentParameter, string.Empty);
        if (!string.IsNullOrWhiteSpace(adjustment))
        {
            this.ExecuteAction(adjustment, 0);
            this.ShowPulse();
        }
    }

    protected override void OnStop()
    {
        lock (this.stateLock)
        {
            this.pulseTimer?.Dispose();
            this.pulseTimer = null;
            this.pulseActive = false;
        }

        base.OnStop();
    }

    private bool IsPulseActive()
    {
        lock (this.stateLock)
        {
            return this.pulseActive;
        }
    }

    private void ShowPulse()
    {
        lock (this.stateLock)
        {
            this.pulseActive = true;
            this.pulseTimer?.Dispose();
            this.pulseTimer = new Timer(_ =>
            {
                lock (this.stateLock)
                {
                    this.pulseActive = false;
                }

                this.Draw();
            }, null, PulseDurationMs, Timeout.Infinite);
        }

        this.Draw();
    }

    private BitmapImage CreateWheelImage(bool pulse)
    {
        try
        {
            var image = ReadEmbeddedImage(pulse
                ? "reasoning-wheel-pulse.png"
                : "reasoning-wheel-idle.png");
            using var builder = this.CreateBitmapBuilder();
            builder.Clear(0xFF000000);
            builder.DrawImage(image, 0, 0, builder.Width, builder.Height, BitmapRotation.None);
            return builder.ToImage();
        }
        catch (Exception exception)
        {
            PluginLog.Error(exception, "Failed to render reasoning wheel");
            using var builder = this.CreateBitmapBuilder();
            builder.Clear(0xFF160B2E);
            return builder.ToImage();
        }
    }

    private static BitmapImage ReadEmbeddedImage(string fileName)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = assembly.GetManifestResourceNames()
            .Single(name => name.EndsWith(fileName, StringComparison.Ordinal));
        return assembly.ReadImage(resourceName);
    }
}
