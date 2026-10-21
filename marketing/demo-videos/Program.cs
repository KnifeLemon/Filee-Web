// Renders the feature demo clips from Filee's real donut: headless Avalonia, frame by frame on a hand-stepped clock,
// drawn over a made-up desktop and encoded with FFmpeg. Run through ../make-demo-videos.ps1 (see ../README.md).
//
// Clips:  expand   a group slice fans out its ring (ExpandClip)
//         flip     Tab turns the donut over to its back face (FlipClip)
//         browser  a picture from a web page, with the download badge over the progress ring (BrowserClip)
//         crop     dropped on the donut's Crop slice, the crop overlay: a corner in, A for the aspect dial at the
//                  pointer, 1:1, Crop & Next, Crop & Save (CropClip)
//
// Per clip and theme:  <clip>-square.mp4 (1080×1080) and <clip>-vertical.mp4 (1080×1920) for social video,
//                      <clip>.webp (820 px, ≤ 1.5 MB), <clip>.gif (820 px, ≤ 3 MB) and <clip>-640.webp (≤ 400 KB)
//                      for pages and slides. The dark theme adds "-dark" after the clip's name.
//
// Options: --out <folder>  --ffmpeg <exe>  --clips a,b  --formats square,vertical,wide  --themes light,dark
//          --stills 1.5,3 (PNG frames into <out>/stills)  --quick (stills only, no video)

using System.Globalization;
using System.Reflection;
using Avalonia;
using Avalonia.Headless;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Filee.App;
using Filee.App.Services;
using Filee.App.ViewModels;
using Filee.Core.Presets;
using Filee.Core.Settings;
using Filee.Marketing.DemoVideos;

var options = args.Select((a, i) => (a, i)).Where(x => x.a.StartsWith("--", StringComparison.Ordinal))
    .ToDictionary(x => x.a[2..], x => x.i + 1 < args.Length && !args[x.i + 1].StartsWith("--", StringComparison.Ordinal) ? args[x.i + 1] : "");
string[] List(string name) => options.TryGetValue(name, out var v) ? v.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) : [];

var repository = Assembly.GetExecutingAssembly().GetCustomAttributes<AssemblyMetadataAttribute>().Single(a => a.Key == "FileeRepo").Value!;
var output = Path.GetFullPath(options.GetValueOrDefault("out") is { Length: > 0 } o ? o : "out/demo-videos");
var ffmpeg = options.GetValueOrDefault("ffmpeg") is { Length: > 0 } f ? f : DemoEncoder.Find(repository)
    ?? throw new InvalidOperationException("FFmpeg not found: pass --ffmpeg, run build/fetch-engines.ps1 in the app repository or put it on the PATH.");
var only = List("clips");
var formats = List("formats");
var themes = List("themes");
var stills = List("stills").Select(s => double.Parse(s, CultureInfo.InvariantCulture)).ToArray();
var quick = options.ContainsKey("quick");
Directory.CreateDirectory(output);

Clip[] clips =
[
    new("expand", (format, painter, vm) => new ExpandClip(format, painter, vm), Dark: true, DemoData.Install),
    new("flip", (format, painter, vm) => new FlipClip(format, painter, vm), Dark: false, () => null),
    new("browser", (format, painter, vm) => new BrowserClip(format, painter, vm), Dark: false, () => null),
    new("crop", (format, painter, vm) => new CropClip(format, painter, vm), Dark: false, CropData.Install),
];

// Filee's app with real Skia rendering and its own fonts, without a window system, and a throw-away data folder (the
// user's settings are never read or written).
AppBuilder.Configure<App>()
    .UseSkia()
    .UseHarfBuzz()
    .ConfigureFonts(fonts => fonts.AddFontCollection(new FileeFontCollection()))
    .UseHeadless(new AvaloniaHeadlessPlatformOptions { UseHeadlessDrawing = false })
    .SetupWithoutStarting();
var data = Directory.CreateTempSubdirectory("filee-demo-videos-").FullName;
try
{
    AppHost.Build(data);
    AppHost.Get<UserDataStore>().Load();
    AppHost.Get<LocalizationService>().Attach(Application.Current!);
    AppHost.Get<LocalizationService>().SetLanguage("en");
    var theme = AppHost.Get<ThemeService>();
    Dispatcher.UIThread.RunJobs();

    foreach (var clip in clips.Where(c => only.Length == 0 || only.Contains(c.Name)))
    {
        using var setup = clip.Setup();
        foreach (var dark in (clip.Dark ? new[] { false, true } : [false]).Where(d => themes.Length == 0 || themes.Contains(d ? "dark" : "light")))
        {
            theme.Apply(new ThemeSettings { Mode = dark ? ThemeMode.Dark : ThemeMode.Light }, "en");
            Motion.Set(true);
            var name = dark ? $"{clip.Name}-dark" : clip.Name;
            var palette = dark ? DemoPalette.Dark : DemoPalette.Light;
            foreach (var format in new[] { DemoFormat.Square, DemoFormat.Vertical, DemoFormat.Wide }.Where(f => formats.Length == 0 || formats.Contains(f.Name)))
            {
                var file = Path.Combine(output, format == DemoFormat.Wide ? $"{name}-master.mkv" : $"{name}-{format.Name}.mp4");
                Record(clip, format, palette, quick ? null : file, Path.Combine(output, "stills", $"{name}-{format.Name}"));
            }
            var master = Path.Combine(output, $"{name}-master.mkv");
            if (quick || !File.Exists(master))
                continue;
            Report(Path.Combine(output, $"{name}.webp"), DemoEncoder.WebP(ffmpeg, master, Path.Combine(output, $"{name}.webp"), 820, 1_500_000));
            Report(Path.Combine(output, $"{name}-640.webp"), DemoEncoder.WebP(ffmpeg, master, Path.Combine(output, $"{name}-640.webp"), 640, 400_000));
            Report(Path.Combine(output, $"{name}.gif"), DemoEncoder.Gif(ffmpeg, master, Path.Combine(output, $"{name}.gif"), 820, 3_000_000));
            File.Delete(master);
        }
    }
}
finally
{
    try
    {
        Directory.Delete(data, true);
    }
    catch (IOException)
    {
    }
}

void Record(Clip clip, DemoFormat format, DemoPalette palette, string? file, string stillPrefix)
{
    var vm = AppHost.Get<RadialViewModel>();
    // The font Filee draws the donut with (ThemeService), for the scene's text too.
    var font = Application.Current!.TryGetResource("AppFontFamily", null, out var value) && value is FontFamily family ? family : FontFamily.Default;
    using var demo = clip.Create(format, new DemoPainter(palette, font), vm);
    using var frame = new RenderTargetBitmap(format.Pixels);
    using var sink = file is null ? null
        : new FrameSink(ffmpeg, format.Pixels, DemoEncoder.Fps, file.EndsWith(".mkv", StringComparison.Ordinal) ? DemoEncoder.Master(file) : DemoEncoder.Mp4(file));
    var watch = System.Diagnostics.Stopwatch.StartNew();
    var frames = (int)Math.Round(demo.Duration * DemoEncoder.Fps);
    var pending = stills.Select(s => (int)Math.Round(s * DemoEncoder.Fps)).ToHashSet();
    if (sink is null)
        frames = pending.Count == 0 ? 0 : Math.Min(frames, pending.Max() + 1);
    for (var i = 0; i < frames; i++)
    {
        using (var dc = frame.CreateDrawingContext(true))
            demo.Render(dc, i / (double)DemoEncoder.Fps);
        sink?.Write(frame);
        if (pending.Contains(i))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(stillPrefix)!);
            frame.Save($"{stillPrefix}-{(i / (double)DemoEncoder.Fps).ToString("00.00", CultureInfo.InvariantCulture)}s.png", new PngBitmapEncoderOptions());
        }
    }
    sink?.Finish();
    Console.WriteLine($"{Path.GetFileName(stillPrefix)}: {frames} frames in {watch.Elapsed.TotalSeconds:0.0} s{(file is null ? "" : $" → {Path.GetFileName(file)}")}");
}

static void Report(string path, long bytes) => Console.WriteLine($"{Path.GetFileName(path)}: {bytes / 1024} KB");

/// <summary>A clip: how to make it, whether it gets a dark version, and what the library needs for it meanwhile.</summary>
internal sealed record Clip(string Name, Func<DemoFormat, DemoPainter, RadialViewModel, DemoClip> Create, bool Dark, Func<IDisposable?> Setup);

/// <summary>
/// The donut the expand clip shows: the image donut with a "Formats" group (PNG, JPG, WEBP) among seven presets, put
/// in place for the recording (in the throw-away data folder).
/// </summary>
internal sealed class DemoData : IDisposable
{
    public const string GroupId = "demo-formats";

    private readonly UserDataStore _store = AppHost.Get<UserDataStore>();
    private readonly List<string> _before;
    private readonly Preset _group = new()
    {
        Id = GroupId,
        Name = "Formats",
        Kind = PresetKind.Group,
        SubPresetIds = ["to-png", "to-jpg", "to-webp"],
    };

    private DemoData()
    {
        var images = _store.Profiles.Single(p => p.Id == "images");
        _before = [.. images.PresetIds];
        _store.Presets.Add(_group);
        images.PresetIds.Clear();
        images.PresetIds.AddRange(["to-pdf", "trace-svg", GroupId, "to-tiff", "to-bmp", "to-ico", "half-size", "trace-line-art"]);
    }

    public static DemoData Install() => new();

    public void Dispose()
    {
        var images = _store.Profiles.Single(p => p.Id == "images");
        images.PresetIds.Clear();
        images.PresetIds.AddRange(_before);
        _store.Presets.Remove(_group);
    }
}
