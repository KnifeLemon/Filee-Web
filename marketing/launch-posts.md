# Launch posts

Ready-to-paste posts for each channel, in the order they are worth doing. Facts as of Filee 1.2.1: 180 formats in 14
categories, 111 of them without extra downloads; Windows 10/11 64-bit; MIT; English, Korean, Simplified Chinese.

Tips that apply everywhere:
- Post from your own account and stay around for the first hours to answer comments: that is what makes these work.
- Attach the vertical video (`out/threads/filee-threads-*-1080x1920.mp4`) or the demo GIF/WebP where the site allows it.
- One channel per day is plenty; read each board's self-promotion rules first.

---

## 1. GeekNews — Show GN (Korean developers) · https://news.hada.io (글쓰기 → Show GN)

**Title**

```
Show GN: Filee – 키를 누른 채 파일을 끌어다 놓으면 변환되는 오픈소스 파일 변환기 (Windows)
```

**URL**: `https://github.com/KnifeLemon/Filee`

**Body**

```
파일을 변환하려고 변환 사이트에 업로드하고 기다리는 게 번거로워서 만든 Windows용 파일 변환기입니다.

- 키를 누른 채 파일을 끌면 커서 옆에 도넛 모양 메뉴가 뜨고, 원하는 형식 위에 놓으면 원본 옆에 변환된 파일이 생깁니다
- 이미지(HEIC·PSD·RAW 포함), PDF, 워드·엑셀·파워포인트, 한글 HWP/HWPX, 전자책, 동영상·오디오, 압축 파일, CAD(DWG·DXF), 글꼴 등 180개 형식
- 모든 변환은 로컬에서 처리 (업로드 없음, 광고·워터마크·회원가입 없음)
- MS 오피스·한컴오피스 없이 DOCX·XLSX·PPTX·HWP 변환 (HWP는 오픈소스 rhwp 엔진)
- 탐색기 우클릭(Windows 11 기본 메뉴), 보내기, 단축키, 드롭존으로도 실행
- FFmpeg·LibreOffice 같은 큰 엔진은 설치할 때 고르거나 필요할 때만 받기 (SHA-256 검증)

기술: C# / .NET 10 + Avalonia, 변환 엔진은 형식별 IConverter 하나씩 붙이는 구조, Windows 11 메뉴는 C로 만든 IExplorerCommand DLL + 서명 없는 sparse MSIX, 설치 프로그램은 Inno Setup을 GitHub Actions에서 빌드합니다. MIT 라이선스.

다운로드: https://filee.sh/ko/
```

---

## 2. Reddit (English) — r/software, r/opensource, r/windows (one per day)

Check each subreddit's self-promotion rule first (r/software asks for a flair; r/windows allows it in the weekly thread
or with clear disclosure).

**Title**

```
I made Filee, a free open-source file converter for Windows: hold a key, drag files, drop them on a format
```

**Body**

```
Hi! I got tired of uploading files to converter websites, so I built a desktop converter that works entirely offline.

How it works: hold a key (Ctrl by default, configurable) and drag files. A donut-shaped menu opens at the cursor; drop the files on a format and the converted files appear next to the originals. You can also use the right-click menu in File Explorer (top level on Windows 11), Send To or a keyboard shortcut.

- 180 formats: images (incl. HEIC, PSD, camera RAW), PDF, Word/Excel/PowerPoint, e-books (EPUB, MOBI, AZW3, CBZ), video and audio, archives, CAD (DWG/DXF), fonts, Korean HWP
- No upload, no ads, no watermark, no account, no file-size limit
- Converts DOCX/XLSX/PPTX without Microsoft Office
- Batch conversion in parallel; presets for quality, size, PDF merge/split, ZIP, output folder and names
- Heavy engines (FFmpeg, LibreOffice, calibre, Ghostscript, Pandoc) are optional downloads you pick in the installer or later
- MIT licensed, C# / .NET 10 + Avalonia

Download: https://filee.sh
Source: https://github.com/KnifeLemon/Filee

The installer isn't code-signed yet, so SmartScreen may say "Windows protected your PC" (More info → Run anyway). Feedback and format requests are very welcome!
```

---

## 3. Hacker News — Show HN · https://news.ycombinator.com/submit

**Title** (80 characters max)

```
Show HN: Filee – Convert files offline by dropping them on a donut menu (Windows)
```

**URL**: `https://github.com/KnifeLemon/Filee`

**First comment** (post it right after submitting)

```
Hi HN, I'm the author. Filee is a Windows desktop converter: hold a modifier key while dragging files and a donut menu of target formats opens at the cursor; drop on one and the output lands next to the originals. Everything runs locally.

It handles 180 formats (images incl. HEIC/RAW, PDF, Office files without Office, e-books, video/audio, archives, DWG/DXF, fonts, and Korean HWP, which is hard to convert without Hancom Office). Large engines like FFmpeg and LibreOffice are optional, pinned and SHA-256 verified downloads.

Some implementation notes:
- C# / .NET 10 with Avalonia; a global hook (SharpHook) detects the drag, and the donut is a transparent topmost window that receives the OLE drop
- conversions are edges in a small graph, and a route planner picks multi-step paths (e.g. HWPX → PDF → PNG)
- the Windows 11 top-level context menu entry is a tiny C IExplorerCommand DLL (built with Zig, no C runtime) registered through an unsigned sparse MSIX package
- the installer (Inno Setup), release notes and website are built from the repo on GitHub Actions

It's MIT licensed. I'd love feedback on the gesture, missing formats and anything that breaks.
```

---

## 4. 小众软件 (appinn.com) — 投稿 · https://meta.appinn.net (发现频道 / 投稿)

```
【软件名称】Filee
【软件简介】按住一个键拖动文件，光标旁会弹出环形菜单，把文件拖到目标格式上即可完成转换。免费开源（MIT），完全离线运行，不上传文件。
【主要特点】
· 支持 180 种格式：图片（含 HEIC、PSD、相机 RAW）、PDF、Word/Excel/PowerPoint、电子书（EPUB、MOBI、AZW3、CBZ）、视频和音频、压缩包、CAD 图纸（DWG/DXF）、字体、韩文 HWP
· 无需安装 Microsoft Office 即可转换 DOCX、XLSX、PPTX
· 支持批量并行转换；预设可调整质量、尺寸，合并或拆分 PDF，打包 ZIP
· 也可以通过资源管理器右键菜单（Windows 11 主菜单）、“发送到”、快捷键使用
· FFmpeg、LibreOffice 等大型引擎可在安装时勾选或之后按需下载
· 界面支持简体中文、英文、韩文
【系统要求】Windows 10/11 64 位
【下载地址】https://filee.sh/zh-cn/
【开源地址】https://github.com/KnifeLemon/Filee
```

---

## 5. V2EX — 分享创造 · https://www.v2ex.com/new/create

**标题**

```
做了一个 Windows 文件转换工具 Filee：按住键拖动文件，丢到环形菜单上就转换好了（开源、离线）
```

**正文**

```
平时转换文件总要上传到在线网站，又慢又不放心，所以做了这个桌面工具。

· 按住一个键（默认 Ctrl，可修改）拖动文件，光标旁弹出环形菜单，拖到目标格式上松开即可，转换结果保存在原文件旁边
· 支持 180 种格式：图片（HEIC、PSD、RAW）、PDF、Office 文档、电子书、视频音频、压缩包、DWG/DXF、字体等
· 全部本地处理，不上传；无广告、无水印、无需注册
· 不装 Office 也能转换 DOCX/XLSX/PPTX
· 技术栈：C# / .NET 10 + Avalonia，MIT 开源

下载：https://filee.sh/zh-cn/
GitHub：https://github.com/KnifeLemon/Filee

安装包暂时没有代码签名，SmartScreen 提示时点“更多信息 → 仍要运行”即可。欢迎反馈和提需求！
```

---

## 6. Korean communities — 디스콰이엇, IT 커뮤니티 자작 프로그램 게시판

Read each board's rules first; some allow self-made software only on specific boards or days.

```
Windows용 무료 파일 변환기 Filee를 만들어 공개했어요.

키를 누른 채 파일을 끌면 커서 옆에 도넛 메뉴가 뜨고, 원하는 형식 위에 놓으면 원본 옆에 변환된 파일이 생겨요.

· 이미지(아이폰 HEIC·PSD·RAW), PDF, 워드·엑셀·파워포인트, 한글 HWP/HWPX, 전자책, 동영상·오디오, 압축 파일, CAD, 글꼴까지 180개 형식
· 내 PC 안에서 변환 (업로드·광고·워터마크·회원가입 없음)
· MS 오피스·한컴오피스 없이도 DOCX·XLSX·PPTX·HWP 변환
· 탐색기 우클릭(Windows 11 기본 메뉴)·보내기·단축키로도 실행
· 여러 파일 한 번에, PDF 하나로 합치기, ZIP으로 묶기

무료·오픈소스(MIT)이고 Windows 10/11 64비트에서 돌아가요.
다운로드: https://filee.sh/ko/
소스: https://github.com/KnifeLemon/Filee

아직 코드 서명이 없어서 설치할 때 "Windows의 PC 보호" 창이 뜨면 "추가 정보 → 실행"을 눌러 주세요. 써 보시고 의견 주시면 반영할게요!
```

---

## 7. Listings (submit once, they keep bringing visitors)

### AlternativeTo · https://alternativeto.net/software/new/

- **Name**: Filee
- **Website**: https://filee.sh
- **Platforms**: Windows
- **License**: Free, Open Source (MIT)
- **Short description**: Free, open-source file converter for Windows: hold a key, drag files and drop them on a format in a donut menu. Converts 180 formats offline.
- **Description**:
  ```
  Filee converts files on your own PC, without uploading them. Hold a key while dragging files and a donut-shaped menu of formats opens at the cursor; drop the files on one and the converted files are saved next to the originals. It also works from the File Explorer right-click menu, Send To and a keyboard shortcut.

  It covers 180 formats: images (including HEIC, PSD and camera RAW), PDF, Word, Excel and PowerPoint without Microsoft Office, Korean HWP/HWPX, e-books and comics, video and audio, archives, CAD drawings (DWG, DXF) and fonts. Batch conversion, presets (quality, size, PDF merge and split, ZIP) and optional engines (FFmpeg, LibreOffice, calibre, Ghostscript, Pandoc) are included. No ads, watermarks or accounts.
  ```
- **Tags**: file-converter, image-converter, pdf-converter, video-converter, document-converter, batch-conversion, offline, drag-and-drop, hwp
- **Alternative to**: CloudConvert, Format Factory, File Converter (Adrien Allard), XnConvert, Convertio, FreeConvert

### Softpedia ("Submit program" link at the bottom of softpedia.com)

- **Category**: Multimedia / Converters (or Office tools / Document converters)
- **Short**: Convert 180 file formats offline by dragging files onto a donut menu: images, PDF, Office, HWP, e-books, video, audio, archives, CAD and fonts.
- **Long**: same as the AlternativeTo description.
- **Download URL**: https://github.com/KnifeLemon/Filee/releases/latest

### winget

Submitted as `KnifeLemon.Filee` (see the pull request in microsoft/winget-pkgs). Once merged, people can run
`winget install KnifeLemon.Filee`, which installs without the SmartScreen prompt.

---

## 8. Search engines

- **Google Search Console** (https://search.google.com/search-console): add `https://filee.sh/` as a URL-prefix property;
  the Google Analytics tag on the site verifies it. Submit `https://filee.sh/sitemap.xml`.
- **Bing Webmaster Tools** (https://www.bing.com/webmasters): "Import from Google Search Console" is the fastest way.
  IndexNow already pings Bing on every deploy.
- **Naver Search Advisor** (https://searchadvisor.naver.com): the site is verified; submit the sitemap under
  요청 → 사이트맵 제출 and request collection of `https://filee.sh/ko/`.
