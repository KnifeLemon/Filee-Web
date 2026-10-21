// Clip "crop": Filee's crop overlay opens over the Pictures folder with trip.jpg and lake.jpg. A corner of the frame is
// dragged in (the thirds grid shows, the size chip follows), the aspect dial opens and 1:1 is picked, "Crop & Next"
// moves on to lake.jpg, a corner in again and "Crop & Save"; the overlay closes and the two cropped photos appear
// beside the originals.

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
    private const double Appear = 0.3, End = 9.6;

    /// <summary>Presses (start, end) of the two drags, and the clicks: the dial, 1:1, "Crop &amp; Next", "Crop &amp; Save".</summary>
    private const double Drag1 = 1.65, Drop1 = 2.7, Dial = 3.4, Square = 4.35, Next = 5.2, Drag2 = 6.0, Drop2 = 6.7, Save = 7.35;

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
    private readonly CropOverlayViewModel _vm;
    private readonly CropOverlayWindow _window;
    private readonly Rect _overlay;     // where the overlay is on the desktop
    private readonly double _pixels;    // window pixels per desktop unit
    private readonly MousePath _path = new();
    private readonly Point _rest;
    private readonly Transitions _transitions;
    private long _clock = Stopwatch.GetTimestamp();
    private readonly long _start;
    private RenderTargetBitmap? _bitmap;
    private Point? _sentPointer;
    private double _closed = -1;   // when the overlay closed after the last photo
    private double _now;

    public CropClip(DemoFormat format, DemoPainter painter) : base(format, painter)
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
        var sources = new[] { (Trip, "trip.jpg"), (Lake, "lake.jpg") }.Select(f => WritePhoto(painter, f.Item1, Path.Combine(_folder, f.Item2))).ToList();

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
        _vm = new CropOverlayViewModel(sources, preset, AppHost.Get<ILocalizer>(), AppHost.Get<UserDataStore>());
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

        _rest = new Point(_overlay.Right - 60, _overlay.Bottom + 10);
        var frame = Frame();
        _path.At(0, _rest).Hold(0.9)
            .At(1.5, frame.TopLeft, 0.06).Hold(Drag1)
            .At(Drop1 - 0.1, PictureAt(0.22, 0.14), 0.02).Hold(Drop1)
            .At(Dial - 0.15, ToDesktop(Named("DialButton"), new Point(0.5, 0.5)), 0.1).Hold(Dial + 0.1);
    }

    public override double Duration => End;

    private Point Pointer(double t) => _path[t];

    private Point Converted(int i) => Format.Slot(_files.Length + i);

    // ───────────────────────── Timeline ─────────────────────────

    protected override void Step(double t)
    {
        _now = t;
        _clock = _start + (long)(t * Stopwatch.Frequency);
        if (_closed >= 0)
            return;

        var pointer = Pointer(t);
        if (_sentPointer != pointer)
        {
            _window.MouseMove(ToWindow(pointer), Pressed(t) ? RawInputModifiers.LeftMouseButton : RawInputModifiers.None);
            _sentPointer = pointer;
        }
        foreach (var down in new[] { Drag1, Dial, Square, Next, Drag2, Save })
            if (Cues.Hit(down))
                _window.MouseDown(ToWindow(pointer), MouseButton.Left);
        foreach (var up in new[] { Drop1, Dial + Click, Square + Click, Next + Click, Drop2, Save + Click })
            if (Cues.Hit(up))
                _window.MouseUp(ToWindow(pointer), MouseButton.Left);

        if (Cues.Hit(Dial + 0.3))
        {
            // The dial is open: on to 1:1, beside its label.
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
                .At(8.3, Converted(0) + new Point(40, 64), 0.1).Hold(8.9)
                .At(End - 0.05, _rest, 0.1).Hold(End);
        }
        if (Cues.Hit(Save + Click))
            WaitFor(() => _closed >= 0);

        _transitions.Step(1.0 / DemoEncoder.Fps);
        Dispatcher.UIThread.RunJobs();
    }

    private static bool Pressed(double t) =>
        t >= Drag1 && t < Drop1 || t >= Drag2 && t < Drop2
        || new[] { Dial, Square, Next, Save }.Any(c => t >= c && t < c + Click);

    // ───────────────────────── Drawing ─────────────────────────

    protected override void Draw(DrawingContext dc, double t)
    {
        var p = Painter;
        var pointer = Pointer(t);
        var leaving = 1 - Ease.Span(t, 9.0, 0.45);
        var arrived = _closed >= 0 && t < End - 0.1;
        Backdrop(dc);
        p.StatusLine(dc, Format.Window, Format.Sidebar, _files.Length + (arrived ? _results.Length : 0));

        // The two photos stay selected while the overlay is open.
        var selected = Ease.Span(t, 0.1, 0.15) * (_closed < 0 ? 1 : 1 - Ease.Span(t, _closed + 0.2, 0.3));
        for (var i = 0; i < _files.Length; i++)
        {
            if (_files[i].IsPhoto)
                p.FileHighlight(dc, Format.Slot(i), selected * 0.8);
            p.File(dc, Format.Slot(i), _files[i]);
        }
        if (arrived)
            for (var i = 0; i < _results.Length; i++)
                Arrive(_closed + 0.25 + i * 0.12, Converted(i), _results[i]);

        DrawOverlay(dc, t);

        foreach (var click in new[] { Drag1, Dial, Square, Next, Drag2, Save })
            p.Ripple(dc, Pointer(click), t - click);
        p.Pointer(dc, pointer, Pressed(t) ? 1 : 0);

        // A file popping in with a glow that fades, and going again as the loop winds down.
        void Arrive(double since, Point at, DemoFile file)
        {
            if (t < since)
                return;
            var shown = Ease.Span(t, since, 0.3) * leaving;
            p.FileHighlight(dc, at, (1 - Ease.Span(t, since + 0.5, 1.0)) * shown);
            var scale = (0.55 + 0.45 * Ease.OutBack(Ease.Span(t, since, 0.42))) * (1 - 0.1 * Ease.Span(t, 9.0, 0.45));
            using (dc.PushOpacity(shown))
            using (dc.PushTransform(Matrix.CreateTranslation(-at.X, -at.Y) * Matrix.CreateScale(scale, scale) * Matrix.CreateTranslation(at.X, at.Y)))
                p.File(dc, at, file);
        }
    }

    /// <summary>The overlay window: growing in at the start, its last picture shrinking away once it closed.</summary>
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
    /// What CropOverlayWindow.axaml's transitions do, on the clip's clock: the dial grows out of its button (opacity
    /// 0.16 s, scale 0.55 → 1 in 0.34 s) and shrinks away, a slice under the pointer moves out (0.24 s), and the strip's
    /// tiles grow and shrink as the current file changes (0.32 s).
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
