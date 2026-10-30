# Forbidden Converter

Forbidden Converter is a free, offline desktop app by ForbiddenFantasy for converting videos and animations, adding watermarks, and merging clips. Export individual files or process several files with the same settings.

No account, subscription, telemetry, or cloud processing is required. Your media stays on your computer, and original source files remain untouched.

## Features

- Import videos, animated WebP, GIF, and supported still images.
- Export WebP, AVIF, GIF, MP4, WebM, MKV, MOV, and AVI.
- Quick presets for common conversion tasks.
- Custom quality, dimensions, frame rate, trimming, and encoding settings.
- Text and image watermarks with adjustable size, opacity, and placement.
- Merge clips in your chosen order using the selected export format and watermark.
- Batch exports, progress reporting, and cancellation.
- Saved presets and remembered input, output, and watermark folders.

This is a video and animation converter. It does not convert every kind of file into every other format.

## Install and open

1. Download the Windows installer from this project's Releases section.
2. Run the installer, review the license, and choose an installation folder.
3. Open **Forbidden Converter** using its desktop or Start menu shortcut.

The current Windows release targets **Windows 10/11 x64 on Intel or AMD PCs**. It is not tied to the developer's computer, and a dedicated graphics card is not required. The packaged app includes its runtime and media tools, so you do not need to install FFmpeg, Node.js, or Python separately.

The installer is unsigned. Native ARM64 and 32-bit Windows builds are not included. Large videos and batch jobs need more processing time and free disk space.

## Your first conversion

1. Click **+ Add media**, or drop files into **Source files**.
2. Select a source file from the list.
3. Under **Conversion**, choose a **Quick preset** or select **Custom settings**.
4. Add an optional watermark under the **Watermark** tab.
5. Click **Choose output folder** and select where the finished files should go.
6. Click **Export selected video**.
7. Watch the **Export queue**. When the job finishes, use **Open** to view it or **Show in folder** to locate it.

The preview shows a source frame and your watermark placement. It does not show the final compression quality. Open the finished export to check playback and appearance.

## Choosing export settings

Quick presets include balanced animated WebP, an under-5-MB WebP target, compact animated AVIF, shareable MP4, and keeping the supported source format with a watermark.

Quick presets preserve source frame timing and control the relevant conversion settings. Choose **Custom settings** to edit those controls yourself.

With Custom settings, you can choose:

- **Output format:** the format of the exported file.
- **Frame rate:** keep **Source FPS**, or choose another rate.
- **Width:** leave blank to keep the original size, or enter a new width. Aspect ratio stays locked.
- **Target size:** an optional file-size goal in MB.
- **Quality:** the balance between image quality and compression.
- **Start / End:** a trim range in seconds.
- **Keep original audio:** retain audio where the selected format supports it.
- **Advanced encoding:** compatible video codec and bitrate options.

Size targets are best effort. The app may try several passes, and a very small target may require reducing dimensions or trimming the clip. The under-5-MB WebP preset can adjust quality and dimensions without intentionally lowering FPS. Animation formats can round frame delays.

WebP, AVIF, and GIF exports are silent animations. Playback support depends on the app or website receiving them.

## Adding a watermark

1. Open **Watermark**.
2. Choose **Text** or **Image** as the watermark type.
3. Enter your text, or click **Choose watermark image** to select a PNG, JPEG, or WebP file.
4. Adjust the size and opacity.
5. Choose a corner, centre placement, custom position, or **Repeat across frame**.
6. Switch the preview to **With watermark** to inspect the result. For custom placement, drag the watermark on the preview.
7. Export normally. The selected watermark is included in the output.

Choose **No watermark** when you only want to convert. Image watermark files must be selected again after restarting the app.

## Exporting several files

Add your files, choose the conversion settings and watermark, then click **Export all sources**. Each source gets its own output file.

Preset settings are resolved for each source. Watermark placement scales to each video's dimensions. Progress appears in the queue, and you can cancel an individual job or use **Cancel all**.

## Merging clips

1. Add at least two source files.
2. Drag the source rows, or use their up/down controls, to arrange the playback order.
3. Choose the output format or preset and optional watermark.
4. Choose an output folder.
5. Click **Merge sources in order**.

The merge uses your selected format, preset, and watermark. The first clip determines the canvas; differently sized clips are fitted with padding. Trim settings apply to the combined timeline. Mixing frame rates can produce variable frame timing where the output format supports it.

Merging and animation imports use temporary disk space. Leave enough free space for working files as well as the finished export.

## Still images and saved presets

Supported still images, including PNG, JPEG, BMP, TIFF, and static WebP, are imported as five-second clips. Use Custom settings and trim to shorten them. This workflow produces video or animation output.

Use **Save current** to store conversion settings and watermark styling under a preset name. Select it later under **Saved presets**. Use **Delete selected** to remove a saved preset.

## License and support

The app is free to use under the included **Forbidden Studio Software License**. It is proprietary freeware. Read `LICENSE` for the full terms; third-party components retain their own licenses.

You can sell and monetize your independently created videos and other content. The software's redistribution and modification terms are separate from your rights to your own creations.

If you would like to support development, use the small **Support on Ko-Fi** button or visit [ko-fi.com/forbidden_fantasy](https://ko-fi.com/forbidden_fantasy). The button opens your browser only when clicked. Donations are optional.
