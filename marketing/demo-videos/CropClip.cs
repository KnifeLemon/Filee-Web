// Clip "crop": trip.jpg and lake.jpg are dragged with Ctrl in the Pictures folder, the donut opens at the pointer and
// they are dropped on its Crop slice; the crop overlay opens on trip.jpg. A corner of the frame is dragged in (the
// thirds grid shows, the size chip follows), A pressed over the picture opens the aspect dial around the pointer and
// 1:1 is picked, "Crop & Next" moves on to lake.jpg, a corner in again and "Crop & Save"; the overlay closes and the
// two cropped photos appear beside the originals.

using System.Diagnostics;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Headless;
using Avalonia.Input;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Threading;
using Avalonia.VisualTree;
using Filee.App.Controls;
using Filee.App.Services;
using Filee.App.ViewModels;
using Filee.App.Views;
using Filee.Core.Localization;
using Filee.Core.Presets;
using Filee.Core.Settings;
using ImageMagick;

namespace Filee.Marketing.DemoVideos;

internal sealed class CropClip : DemoClip
{
    /// <summary>The drag onto the donut: the press on trip.jpg, the donut opening, the drop on Crop.</summary>
    private const double Press = 0.85, Open = 1.0, Drop = 2.2;

    private const double Appear = 2.3, End = 11.4;

    /// <summary>
    /// In the overlay: presses (start, end) of the two drags, A over the picture, and the clicks: 1:1, "Crop &amp;
    /// Next", "Crop &amp; Save".
    /// </summary>
    private const double Drag1 = 3.55, Drop1 = 4.6, KeyA = 5.25, Square = 6.15, Next = 7.0, Drag2 = 7.8, Drop2 = 8.5, Save = 9.15;

    private const double Click = 0.08;

    private static readonly DemoFile[] Documents =
    [
        new("budget.xlsx", "XLSX", Color.Parse("#1D9E75")),
        new("notes.txt", "TXT", Color.Parse("#5F5E5A")),
        new("report.docx", "DOCX", Color.Parse("#378ADD")),
        new("slides.pdf", "PDF", Color.Parse("#D85A30")),
    ];

    private static readonly DemoFile Trip = new("trip.jpg", "JPG", Color.Parse("#BA7517"), IsPhoto: true);
    private static readonly DemoFile Lake = new("lake.jpg", "JPG", Color.Parse("#BA7517"), IsPhoto: true, Lake: true);
    private static readonly string[] Places = ["Home", "Desktop", "Documents", "Downloads", "Pictures"];

    private readonly DemoFile[] _files;
    private readonly DemoFile[] _results;
    private readonly string _folder;
    private readonly IReadOnlyList<string> _sources;
    private readonly RadialViewModel _radial;
    private readonly DonutLayer _donut;
    private readonly CropOverlayViewModel _vm;
    private readonly CropOverlayWindow _window;
    private readonly Rect _overlay;     // where the overlay is on the desktop
    private readonly double _pixels;    // window pixels per desktop unit
    private readonly MousePath _path = new();
    private readonly Point _rest, _source, _corner, _onPicture;
    private readonly Transitions _transitions;
    private long _clock = Stopwatch.GetTimestamp();
    private readonly long _start;
    private RenderTargetBitmap? _bitmap;
    private Point? _sentPointer;
    private double _closed = -1;   // when the overlay closed after the last photo
    private double _now;

    public CropClip(DemoFormat format, DemoPainter painter, RadialViewModel radial) : base(format, painter)
    {
        _files = [.. Documents.Take(format.Columns), Trip, Lake];
        _results =
        [
            Trip with { Name = "trip_cropped.jpg" },
            Lake with { Name = "lake_cropped.jpg" },
        ];
        _start = _clock;
        CropCanvas.Clock = () => _clock;

        // The photos the folder shows, as files the overlay opens (written as JPEG, as their names say).
        _folder = Directory.CreateTempSubdirectory("filee-demo-crop-").FullName;
        _sources = new[] { (Trip, "trip.jpg"), (Lake, "lake.jpg") }.Select(f => WritePhoto(painter, f.Item1, Path.Combine(_folder, f.Item2))).ToList();
        _radial = radial;
        _donut = new DonutLayer(radial, format.Scale);

        // The overlay's size in its own units, and where it goes on the desktop.
        var (size, place) = format.Name switch
        {
            "square" => (new Size(720, 560), new Rect(36, 104, 648, 504)),
            "vertical" => (new Size(600, 600), new Rect(15, 232, 510, 510)),
            _ => (new Size(880, 500), new Rect(133, 70, 757, 430)),
        };
        _overlay = place;
        _pixels = format.Scale;
        var zoom = format.Scale * place.Width / size.Width;
        var preset = BuiltInData.CreatePresets().Single(p => p.Id == "tool-crop");
        _vm = new CropOverlayViewModel(_sources, preset, AppHost.Get<ILocalizer>(), AppHost.Get<UserDataStore>());
        _window = new CropOverlayWindow { DataContext = _vm, Width = size.Width * zoom, Height = size.Height * zoom };
        // Scaled by a layout transform (crisp, like a high-DPI screen), as DonutLayer does.
        var root = (Control)_window.Content!;
        _window.Content = null;
        _window.Content = new LayoutTransformControl { LayoutTransform = new ScaleTransform(zoom, zoom), Child = root };
        TextOptions.SetTextRenderingMode(_window, TextRenderingMode.Antialias);
        ToolTip.SetServiceEnabled(_window, false); // tooltips open on a wall-clock delay
        _window.Closed += (_, _) => _closed = _now;
        _window.Show();
        WaitFor(() => _vm.PreviewImage is not null && !_vm.IsBusy);
        // The styles' transitions run on the render timer, which doesn't run here: they are played below on the
        // clip's clock. The canvas's own animations read CropCanvas.Clock.
        _window.SettleForCapture();
        _window.CropCanvas.PlayAnimations = true;
        _transitions = new Transitions(_window, _vm);
        _window.UpdateLayout();

        _source = format.Slot(_files.Length - 2);
        _rest = _source + new Point(250, 175);
        _corner = Frame().TopLeft;
        _onPicture = PictureAt(0.62, 0.42);
        // Up to the drag starting; the way over the donut is known once it is open (where its slices are).
        _path.At(0, _rest).Hold(0.15)
            .At(0.75, _source + new Point(4, -2), 0.1).Hold(Press)
            .At(Open, _source + new Point(10, 4), 0);
    }

    public override double Duration => End;

    private Point Pointer(double t) => _path[t];

    private Point Converted(int i) => Format.Slot(_files.Length + i);

    // ───────────────────────── Timeline ─────────────────────────

    protected override void Step(double t)
    {
        _now = t;
        _clock = _start + (long)(t * Stopwatch.Frequency);
        var pointer = Pointer(t);

        // The drag onto the donut. The dispatcher doesn't run meanwhile: the donut's own frame loop would step it by
        // wall-clock time (DonutLayer).
        if (Cues.Hit(Open))
        {
            _donut.OpenAt(pointer, _sources);
            PlanAfterOpening();
        }
        if (_donut.IsShown && t < Drop)
            _donut.DragOver(pointer);
        if (Cues.Hit(Drop))
        {
            var hit = _donut.Drop(pointer);
            var crop = _radial.Presets.ToList().FindIndex(p => p.Id == "tool-crop");
            if (hit != new DonutHit(DonutHitKind.Segment, crop))
                throw new InvalidOperationException($"The photos were dropped on {hit}, not on Crop ({crop}).");
            // A tool's slice opens its window instead of a progress ring (RadialController).
            _donut.Hide();
        }
        if (_donut.IsShown)
            _donut.Step();
        if (t < Appear || _closed >= 0)
            return;

        if (_sentPointer != pointer)
        {
            _window.MouseMove(ToWindow(pointer), Pressed(t) ? RawInputModifiers.LeftMouseButton : RawInputModifiers.None);
            _sentPointer = pointer;
        }
        foreach (var down in new[] { Drag1, Square, Next, Drag2, Save })
            if (Cues.Hit(down))
                _window.MouseDown(ToWindow(pointer), MouseButton.Left);
        foreach (var up in new[] { Drop1, Square + Click, Next + Click, Drop2, Save + Click })
            if (Cues.Hit(up))
                _window.MouseUp(ToWindow(pointer), MouseButton.Left);

        if (Cues.Hit(KeyA))
        {
            // A with the pointer over the picture: the dial opens around the pointer.
            _window.KeyPress(Key.A, RawInputModifiers.None, PhysicalKey.A, "a");
            _window.KeyRelease(Key.A, RawInputModifiers.None, PhysicalKey.A, "a");
            if (!_vm.IsAspectDialOpen)
                throw new InvalidOperationException("A didn't open the aspect dial.");
        }
        if (Cues.Hit(KeyA + 0.3))
        {
            // On to 1:1, beside its label.
            var dial = _window.AspectDial;
            var index = dial.Segments.ToList().FindIndex(s => s.Mode == "1:1");
            var center = new Point(dial.Bounds.Width / 2, dial.Bounds.Height / 2);
            var onSquare = dial.TranslatePoint(DonutGeometry.PointAt(center, dial.OuterRadius - 14, DonutGeometry.MidAngle(index, dial.Segments.Count())), _window)!.Value;
            _path.At(Square - 0.15, Desktop(onSquare), -0.1).Hold(Square + 0.1)
                .At(Next - 0.15, ToDesktop(Named("PrimaryButton"), new Point(0.4, 0.55)), 0.08).Hold(Next + 0.1);
        }
        if (Cues.Hit(Square + Click) && _vm.SelectedAspect != "1:1")
            throw new InvalidOperationException($"The click picked {_vm.SelectedAspect}, not 1:1.");
        if (Cues.Hit(Next + Click))
        {
            // The crop is written and the next photo loads off the UI thread; the clip's clock waits for them.
            WaitFor(() => _vm.CurrentIndex == 1 && !_vm.IsBusy && _vm.PreviewImage is not null);
            var corner = Frame().BottomRight;
            _path.At(Drag2 - 0.1, corner, 0.08).Hold(Drag2)
                .At(Drop2 - 0.05, corner - new Point(_overlay.Width * 0.12, _overlay.Height * 0.12), 0.02).Hold(Drop2)
                .At(Save - 0.15, ToDesktop(Named("PrimaryButton"), new Point(0.4, 0.55)), 0.08).Hold(Save + 0.1)
                .At(10.1, Converted(0) + new Point(40, 64), 0.1).Hold(10.7)
                .At(End - 0.05, _rest, 0.1).Hold(End);
        }
        if (Cues.Hit(Save + Click))
            WaitFor(() => _closed >= 0);

        _transitions.Step(1.0 / DemoEncoder.Fps);
        Dispatcher.UIThread.RunJobs();
    }

    /// <summary>From the hole onto Crop; after the drop into the overlay, to the corner, over the picture for A.</summary>
    private void PlanAfterOpening()
    {
        var donut = _donut.Donut;
        var crop = _radial.Presets.ToList().FindIndex(p => p.Id == "tool-crop");
        if (crop < 0)
            throw new InvalidOperationException("Crop isn't on the donut's front (CropData).");
        var inner = donut.OuterRadius * donut.HoleRatio;
        var onCrop = DonutGeometry.PointAt(_donut.Center, (inner + donut.OuterRadius) / 2 + 6, DonutGeometry.MidAngle(crop, donut.Items!.Count) + 0.05);
        _path.Hold(1.35)
            .At(1.95, onCrop, -0.12).Hold(Drop)
            .At(Drag1 - 0.15, _corner, 0.06).Hold(Drag1)
            .At(Drop1 - 0.1, PictureAt(0.22, 0.14), 0.02).Hold(Drop1)
            .At(KeyA - 0.2, _onPicture, 0.08).Hold(KeyA + 0.3);
    }

    private static bool Pressed(double t) =>
        t >= Press && t < Drop || t >= Drag1 && t < Drop1 || t >= Drag2 && t < Drop2
        || new[] { Square, Next, Save }.Any(c => t >= c && t < c + Click);

    // ───────────────────────── Drawing ─────────────────────────

    protected override void Draw(DrawingContext dc, double t)
    {
        var p = Painter;
        var pointer = Pointer(t);
        var leaving = 1 - Ease.Span(t, 10.8, 0.45);
        var arrived = _closed >= 0 && t < End - 0.1;
        Backdrop(dc);
        p.StatusLine(dc, Format.Window, Format.Sidebar, _files.Length + (arrived ? _results.Length : 0));

        // The two photos are selected from the press until the overlay has closed.
        var selected = Ease.Span(t, Press, 0.08) * (_closed < 0 ? 1 : 1 - Ease.Span(t, _closed + 0.2, 0.3));
        for (var i = 0; i < _files.Length; i++)
        {
            if (_files[i].IsPhoto)
                p.FileHighlight(dc, Format.Slot(i), selected * 0.8);
            p.File(dc, Format.Slot(i), _files[i]);
        }
        if (arrived)
            for (var i = 0; i < _results.Length; i++)
                Arrive(_closed + 0.25 + i * 0.12, Converted(i), _results[i]);

        _donut.Draw(dc);
        DrawOverlay(dc, t);

        p.DragGhost(dc, pointer, Trip, t >= Open && t < Drop ? Ease.Span(t, Open - 0.1, 0.12) : 0);
        foreach (var click in new[] { Press, Drop, Drag1, Square, Next, Drag2, Save })
            p.Ripple(dc, Pointer(click), t - click);
        // Ctrl held to drag onto the donut, A pressed over the picture.
        p.KeyCap(dc, Format.KeyCap, "Ctrl", Ease.Window(t, 0.42, 2.45, 0.14), Ease.Span(t, 0.5, 0.06) * (1 - Ease.Span(t, Drop, 0.08)));
        p.KeyCap(dc, Format.KeyCap, "A", Ease.Window(t, KeyA - 0.35, KeyA + 0.7, 0.14), Ease.Span(t, KeyA - 0.06, 0.06) * (1 - Ease.Span(t, KeyA + 0.2, 0.08)));
        p.Pointer(dc, pointer, Pressed(t) ? 1 : 0);

        // A file popping in with a glow that fades, and going again as the loop winds down.
        void Arrive(double since, Point at, DemoFile file)
        {
            if (t < since)
                return;
            var shown = Ease.Span(t, since, 0.3) * leaving;
            p.FileHighlight(dc, at, (1 - Ease.Span(t, since + 0.5, 1.0)) * shown);
            var scale = (0.55 + 0.45 * Ease.OutBack(Ease.Span(t, since, 0.42))) * (1 - 0.1 * Ease.Span(t, 10.8, 0.45));
            using (dc.PushOpacity(shown))
            using (dc.PushTransform(Matrix.CreateTranslation(-at.X, -at.Y) * Matrix.CreateScale(scale, scale) * Matrix.CreateTranslation(at.X, at.Y)))
                p.File(dc, at, file);
        }
    }

    /// <summary>The overlay window: growing in after the drop, its last picture shrinking away once it closed.</summary>
    private void DrawOverlay(DrawingContext dc, double t)
    {
        if (t < Appear)
            return;
        if (_closed < 0)
        {
            _window.UpdateLayout();
            var pixels = new PixelSize((int)Math.Ceiling(_window.ClientSize.Width), (int)Math.Ceiling(_window.ClientSize.Height));
            if (_bitmap?.PixelSize != pixels)
            {
                _bitmap?.Dispose();
                _bitmap = new RenderTargetBitmap(pixels);
            }
            using (_bitmap.CreateDrawingContext(true))
            {
                // cleared: the window is see-through around its rounded frame
            }
            _bitmap.Render(_window);
        }
        if (_bitmap is null)
            return;
        var shown = _closed < 0 ? Ease.OutCubic(Ease.Span(t, Appear, 0.3)) : 1 - Ease.OutCubic(Ease.Span(t, _closed, 0.25));
        if (shown <= 0.001)
            return;
        var scale = 0.96 + 0.04 * shown;
        var center = _overlay.Center;
        using (dc.PushOpacity(shown))
        using (dc.PushTransform(Matrix.CreateTranslation(-center.X, -center.Y) * Matrix.CreateScale(scale, scale) * Matrix.CreateTranslation(center.X, center.Y)))
            dc.DrawImage(_bitmap, new Rect(_overlay.TopLeft, new Size(_bitmap.PixelSize.Width / _pixels, _bitmap.PixelSize.Height / _pixels)));
    }

    protected override void DrawBackdrop(DrawingContext dc)
    {
        Painter.Desktop(dc, Format);
        Painter.FileManager(dc, Format.Window, Format.Sidebar, "Home", "Pictures", Places, Places.Length - 1);
    }

    // ───────────────────────── Places ─────────────────────────

    private Point ToWindow(Point desktop) => (desktop - _overlay.TopLeft) * _pixels;

    private Point Desktop(Point window) => _overlay.TopLeft + window / _pixels;

    /// <summary>A point of <paramref name="control"/> given as a share of its size, on the desktop.</summary>
    private Point ToDesktop(Control control, Point share) =>
        Desktop(control.TranslatePoint(new Point(control.Bounds.Width * share.X, control.Bounds.Height * share.Y), _window)!.Value);

    private Button Named(string name) => _window.GetVisualDescendants().OfType<Button>().Single(b => b.Name == name);

    /// <summary>The crop frame on the desktop.</summary>
    private Rect Frame()
    {
        var canvas = _window.CropCanvas;
        var rect = canvas.GetScreenCropRect(canvas.CalculateImageBounds());
        var topLeft = canvas.TranslatePoint(rect.TopLeft, _window)!.Value;
        var bottomRight = canvas.TranslatePoint(rect.BottomRight, _window)!.Value;
        return new Rect(Desktop(topLeft), Desktop(bottomRight));
    }

    /// <summary>A point of the picture given as a share of its size, on the desktop.</summary>
    private Point PictureAt(double x, double y)
    {
        var canvas = _window.CropCanvas;
        var image = canvas.CalculateImageBounds();
        return Desktop(canvas.TranslatePoint(new Point(image.X + image.Width * x, image.Y + image.Height * y), _window)!.Value);
    }

    // ───────────────────────── Setup ─────────────────────────

    /// <summary>The photo of a file icon, drawn large and saved as a JPEG for the overlay to open.</summary>
    private static string WritePhoto(DemoPainter painter, DemoFile file, string path)
    {
        using var bitmap = new RenderTargetBitmap(new PixelSize(1600, 1000));
        using (var dc = bitmap.CreateDrawingContext(true))
            painter.Photo(dc, new Rect(0, 0, 1600, 1000), 0, file.Lake);
        using var png = new MemoryStream();
        bitmap.Save(png, new PngBitmapEncoderOptions());
        png.Position = 0;
        using var image = new MagickImage(png);
        image.Quality = 92;
        image.Write(path, MagickFormat.Jpeg);
        return path;
    }

    private static void WaitFor(Func<bool> condition)
    {
        for (var i = 0; i < 1000 && !condition(); i++)
        {
            Dispatcher.UIThread.RunJobs();
            Thread.Sleep(10);
        }
        if (!condition())
            throw new InvalidOperationException("The crop overlay didn't get there in time.");
    }

    public override void Dispose()
    {
        if (_closed < 0)
            _window.Close();
        _donut.Dispose();
        _bitmap?.Dispose();
        CropCanvas.Clock = Stopwatch.GetTimestamp;
        try
        {
            Directory.Delete(_folder, true);
        }
        catch (IOException)
        {
        }
        base.Dispose();
    }

    /// <summary>
    /// What CropOverlayWindow.axaml's transitions do, on the clip's clock: the dial grows out of its button or around
    /// the pointer (opacity 0.16 s, scale 0.55 → 1 in 0.34 s) and shrinks away, a slice under the pointer moves out
    /// (0.24 s), and the strip's tiles grow and shrink as the current file changes (0.32 s).
    /// </summary>
    private sealed class Transitions
    {
        private readonly CropOverlayWindow _window;
        private readonly CropOverlayViewModel _vm;
        private readonly Glide _opacity = new(0, 0.16, t => t), _scale = new(0.55, 0.34, BackEaseOut);
        private readonly Dictionary<RingSegment, Glide> _pops;
        private readonly Dictionary<Border, (Glide Scale, Glide Opacity)> _tiles = [];

        public Transitions(CropOverlayWindow window, CropOverlayViewModel vm)
        {
            (_window, _vm) = (window, vm);
            window.AspectDial.Transitions = null;
            _pops = window.AspectDial.Segments.ToDictionary(s => s, _ => new Glide(0, 0.24, BackEaseOut));
            foreach (var segment in _pops.Keys)
                segment.Transitions = null;
        }

        public void Step(double dt)
        {
            var dial = _window.AspectDial;
            var open = _vm.IsAspectDialOpen;
            dial.Opacity = _opacity.Step(open ? 1 : 0, dt);
            var s = _scale.Step(open ? 1 : 0.55, dt);
            dial.RenderTransform = new ScaleTransform(s, s);
            dial.IsVisible = open || dial.Opacity > 0.001;
            foreach (var (segment, pop) in _pops)
                segment.Pop = pop.Step(segment.IsPointerOver ? 1 : 0, dt);
            foreach (var tile in _window.GetVisualDescendants().OfType<Border>().Where(b => b.Classes.Contains("tile")))
            {
                if (!_tiles.TryGetValue(tile, out var glide))
                    _tiles[tile] = glide = (new Glide(TileScale(tile), 0.32, BackEaseOut), new Glide(TileOpacity(tile), 0.2, t => t));
                var size = glide.Scale.Step(TileScale(tile), dt);
                tile.RenderTransform = new ScaleTransform(size, size);
                tile.Opacity = glide.Opacity.Step(TileOpacity(tile), dt);
            }
        }

        private static double TileScale(Border tile) => tile.Classes.Contains("current") ? 1.08 : 0.86;

        private static double TileOpacity(Border tile) =>
            tile.Classes.Contains("current") ? 1 : tile.Classes.Contains("skipped") || tile.Classes.Contains("failed") ? 0.55 : 0.9;

        // Avalonia's BackEaseOut (the SoftEase of Filee's styles).
        private static double BackEaseOut(double t)
        {
            var p = 1 - t;
            return 1 - p * (p * p - Math.Sin(p * Math.PI));
        }
    }

    /// <summary>A value easing to where the styles put it, as their transition would: a new target starts from where it is.</summary>
    private sealed class Glide(double value, double seconds, Func<double, double> easing)
    {
        private double _from = value, _to = value;
        private double _age = double.PositiveInfinity; // at rest
        private double _value = value;

        public double Step(double target, double dt)
        {
            if (target != _to)
                (_from, _to, _age) = (_value, target, 0);
            _age += dt;
            _value = _from + (_to - _from) * easing(Math.Clamp(_age / seconds, 0, 1));
            return _value;
        }
    }
}

/// <summary>
/// The crop clip's donut: Crop on the image donut's front, where Half size is (it ships on the back face, which Tab
/// turns to), put in place for the recording (in the throw-away data folder).
/// </summary>
internal sealed class CropData : IDisposable
{
    private readonly UserDataStore _store = AppHost.Get<UserDataStore>();
    private readonly List<string> _front, _back;

    private CropData()
    {
        var images = _store.Profiles.Single(p => p.Id == "images");
        (_front, _back) = ([.. images.PresetIds], [.. images.BackPresetIds ?? []]);
        images.PresetIds[images.PresetIds.IndexOf("half-size")] = "tool-crop";
        images.BackPresetIds?.Remove("tool-crop");
    }

    public static CropData Install() => new();

    public void Dispose()
    {
        var images = _store.Profiles.Single(p => p.Id == "images");
        images.PresetIds = _front;
        images.BackPresetIds = _back;
    }
}
