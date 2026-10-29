// pad.xml: the Portable Application Description (PAD 4.0) that download sites such as Softpedia read to list Filee
// and to pick up new versions on their own. Version, date, size and download links come from the latest GitHub
// release at build time; if GitHub can't be reached the build uses FALLBACK (the release current when this was written).

import { stats } from './catalog.mjs';
import { REPO, SITE } from './layout.mjs';

/** Used when the GitHub API does not answer during the build. */
const FALLBACK = {
  version: '2.2.0',
  date: '2026-10-28',
  setup: { name: 'Filee-2.2.0-win-Setup.exe', size: 133_133_496 },
  portable: { name: 'Filee-2.2.0-win-Portable.zip', size: 157_977_572 },
};

/** Version, release date and the installer / portable zip of the latest release. */
export async function latestRelease() {
  try {
    const api = REPO.replace('https://github.com/', 'https://api.github.com/repos/') + '/releases/latest';
    const response = await fetch(api, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`GitHub API: ${response.status}`);
    const release = await response.json();
    const asset = pattern => release.assets.find(a => pattern.test(a.name));
    const setup = asset(/-win-Setup\.exe$/i), portable = asset(/-win-Portable\.zip$/i);
    if (!setup) throw new Error('no installer in the latest release');
    return {
      version: release.tag_name.replace(/^v/i, ''),
      date: release.published_at.slice(0, 10),
      setup: { name: setup.name, size: setup.size },
      portable: portable ? { name: portable.name, size: portable.size } : null,
    };
  } catch (error) {
    console.warn(`pad.xml: using the fallback release (${error.message})`);
    return FALLBACK;
  }
}

const { formatTotal, categoryCount } = stats();

const DESCRIPTIONS = {
  45: `Convert ${formatTotal} file formats by drag and drop`,
  80: 'Free, open-source file converter: drop files on a donut menu, convert offline',
  250: 'Free, open-source file converter for Windows. Hold a key, drag files and drop them on a format in a donut menu: '
    + `images, PDF, Office, HWP, e-books, video, audio, subtitles, data, 3D and more, ${formatTotal} formats, offline.`,
  450: 'Filee converts files on your own PC, without uploading them. Hold a key while dragging files and a donut-shaped '
    + 'menu of formats opens at the cursor; drop the files on one and the converted files appear next to the originals. '
    + `It handles ${formatTotal} formats: images (HEIC, PSD, RAW), PDF, Office files without Office, Korean HWP, e-books, `
    + 'video, audio, subtitles, data, 3D models, maps, archives, CAD and fonts. No ads, no account.',
  2000: `Filee converts files on your own PC, without uploading them anywhere. Hold a key while dragging files and a donut-shaped menu of formats opens at the cursor; drop the files on a format and the converted files are saved next to the originals. You can also convert from the File Explorer right-click menu (top level on Windows 11), Send To, a keyboard shortcut or the drop zone in the main window.

Filee handles ${formatTotal} formats in ${categoryCount} categories: images, including iPhone HEIC, Photoshop PSD and camera RAW, and pictures traced into SVG; PDF to images, Word, PowerPoint slides or text, and PDF merge, split, compression and page ranges; Word, Excel and PowerPoint without Microsoft Office; Korean HWP/HWPX without Hancom Office; e-books and comics (EPUB, MOBI, AZW3, FB2, CBZ, CBR); video and audio (MP4, MOV, MKV, WEBM, MP3, FLAC and more), video to GIF, every frame as pictures, hardware encoding and audio extraction; subtitles (SRT, ASS, WebVTT, SMI); data files (JSON, YAML, TOML, XML); 3D models (GLB, STL, OBJ, 3MF, FBX); maps and GPS data (GeoJSON, KML, GPX, Shapefile); archives (ZIP, 7Z, RAR, TAR); CAD drawings (DWG, DXF) and fonts (TTF, OTF, WOFF).

It converts many files at once in parallel, and one failure doesn't stop the rest. Presets per file type set quality, size, rotation, DPI, metadata, PDF merging and splitting, ZIP packing, the output folder and file names. Large engines (FFmpeg, LibreOffice, calibre, Ghostscript, Pandoc) are optional: pick them in the installer or download them later in the app. No ads, no watermarks, no account and no file-size limits. The interface is available in English, Spanish, Japanese, Korean, Simplified and Traditional Chinese, Polish, Hindi, Russian, Arabic, Brazilian Portuguese, French, Nepali, Thai, Turkish, European Portuguese, German and Italian, with light and dark themes. Filee also runs on Linux (x64 and ARM64) and, as a preview, on macOS 13+. It is open source under the MIT license.`,
};

const KEYWORDS = 'file converter, image converter, pdf converter, video converter, document converter, heic to jpg, '
  + 'docx to pdf, hwp converter, batch converter, offline, drag and drop, open source';

const escapeXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** pad.xml for a release from latestRelease(). Throws when a description is longer than PAD allows. */
export function padXml(release) {
  for (const [limit, text] of Object.entries(DESCRIPTIONS)) {
    if (text.length > Number(limit)) throw new Error(`pad.xml: Char_Desc_${limit} is ${text.length} characters`);
  }
  const download = name => `${REPO}/releases/download/v${release.version}/${name}`;
  const [year, month, day] = release.date.split('-');
  const tag = (name, value) => `<${name}>${escapeXml(value ?? '')}</${name}>`;
  const size = release.setup.size;

  return `<?xml version="1.0" encoding="UTF-8"?>
<XML_DIZ_INFO>
  <MASTER_PAD_VERSION_INFO>
    ${tag('MASTER_PAD_VERSION', '4.0')}
    ${tag('MASTER_PAD_EDITOR', 'filee.sh build (site/src/pad.mjs)')}
    ${tag('MASTER_PAD_INFO', 'Portable Application Description, or PAD for short, is a data set that is used by shareware authors to disseminate information to anyone interested in their software products. To find out more go to http://pad.asp-software.org')}
  </MASTER_PAD_VERSION_INFO>
  <Company_Info>
    ${tag('Company_Name', 'KnifeLemon')}
    ${tag('Address_1')}
    ${tag('Address_2')}
    ${tag('City_Town')}
    ${tag('State_Province')}
    ${tag('Zip_Postal_Code')}
    ${tag('Country', 'South Korea')}
    ${tag('Company_WebSite_URL', `${SITE}/`)}
    <Contact_Info>
      ${tag('Author_First_Name', 'KnifeLemon')}
      ${tag('Author_Last_Name')}
      ${tag('Author_Email', 'knifelemon@gmail.com')}
      ${tag('Contact_First_Name', 'KnifeLemon')}
      ${tag('Contact_Last_Name')}
      ${tag('Contact_Email', 'knifelemon@gmail.com')}
    </Contact_Info>
    <Support_Info>
      ${tag('Sales_Email', 'knifelemon@gmail.com')}
      ${tag('Support_Email', 'knifelemon@gmail.com')}
      ${tag('General_Email', 'knifelemon@gmail.com')}
      ${tag('Sales_Phone')}
      ${tag('Support_Phone')}
      ${tag('General_Phone')}
      ${tag('Fax_Phone')}
    </Support_Info>
  </Company_Info>
  <Program_Info>
    ${tag('Program_Name', 'Filee')}
    ${tag('Program_Version', release.version)}
    ${tag('Program_Release_Month', month)}
    ${tag('Program_Release_Day', day)}
    ${tag('Program_Release_Year', year)}
    ${tag('Program_Cost_Dollars', '0')}
    ${tag('Program_Cost_Other_Code', 'USD')}
    ${tag('Program_Cost_Other', '0')}
    ${tag('Program_Type', 'Freeware')}
    ${tag('Program_Release_Status', /^\d+\.0\.0$/.test(release.version) ? 'Major Update' : 'Minor Update')}
    ${tag('Program_Install_Support', 'Install and Uninstall')}
    ${tag('Program_OS_Support', 'Windows 10,Windows 11')}
    ${tag('Program_Language', 'English,Spanish,Japanese,Korean,Chinese,Polish,Hindi,Russian,Arabic,Portuguese')}
    ${tag('Program_Change_Info', `See ${REPO}/releases/tag/v${release.version}`)}
    ${tag('Program_Specific_Category', 'File Converters')}
    ${tag('Program_Category_Class', 'Utilities::File & Disk Management')}
    ${tag('Program_System_Requirements', 'Windows 10 version 1809 or later, or Windows 11 (64-bit). The .NET runtime is included.')}
    <File_Info>
      ${tag('File_Size_Bytes', size)}
      ${tag('File_Size_K', Math.round(size / 1024))}
      ${tag('File_Size_MB', (size / 1_048_576).toFixed(2))}
    </File_Info>
    <Expire_Info>
      ${tag('Has_Expire_Info', 'N')}
      ${tag('Expire_Count')}
      ${tag('Expire_Based_On', 'Days')}
      ${tag('Expire_Other_Info')}
      ${tag('Expire_Month')}
      ${tag('Expire_Day')}
      ${tag('Expire_Year')}
    </Expire_Info>
  </Program_Info>
  <Program_Descriptions>
    <English>
      ${tag('Keywords', KEYWORDS)}
${Object.entries(DESCRIPTIONS).map(([limit, text]) => `      ${tag(`Char_Desc_${limit}`, text)}`).join('\n')}
    </English>
  </Program_Descriptions>
  <Web_Info>
    <Application_URLs>
      ${tag('Application_Info_URL', `${SITE}/`)}
      ${tag('Application_Order_URL')}
      ${tag('Application_Screenshot_URL', 'https://raw.githubusercontent.com/KnifeLemon/Filee/main/docs/media/page-toolbar-en.png')}
      ${tag('Application_Icon_URL', `${SITE}/favicon-32.png`)}
      ${tag('Application_XML_File_URL', `${SITE}/pad.xml`)}
    </Application_URLs>
    <Download_URLs>
      ${tag('Primary_Download_URL', download(release.setup.name))}
      ${tag('Secondary_Download_URL', release.portable ? download(release.portable.name) : `${REPO}/releases/latest`)}
      ${tag('Additional_Download_URL_1', `${REPO}/releases/latest`)}
      ${tag('Additional_Download_URL_2')}
    </Download_URLs>
  </Web_Info>
  <Permissions>
    ${tag('Distribution_Permissions', 'Filee is free and open source under the MIT license. You may distribute the unmodified installer and portable zip.')}
    ${tag('EULA', 'MIT License. Copyright (c) Filee contributors. See ' + REPO + '/blob/main/LICENSE')}
  </Permissions>
</XML_DIZ_INFO>
`;
}
