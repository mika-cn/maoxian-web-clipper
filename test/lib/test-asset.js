
import H from '../helper.js';
import Asset from '../../src/js/lib/asset.js';

describe("Asset", () => {

  const template = '$TIME-INTSEC-$MD5URL$EXT';
  const now = Date.now();

  it("getNameByLink: link only", () => {
    const link = 'https://a.org/foo.jpg';
    const name = Asset.getNameByLink({template, link, now});
    H.assertMatch(name, /^[^\.\/]+\.jpg$/);
  });

  it("getNameByLink: with extension", () => {
    const link = 'https://a.org/foo.jpg';
    const name = Asset.getNameByLink({
      template: template,
      link: link,
      extension: 'txt',
      now: now
    });
    H.assertMatch(name, /^[^\.\/]+\.txt$/);
  });

  it("getNameByLink: link doesn't has an extension", () => {
    const link = 'https://a.org/foo';
    const name = Asset.getNameByLink({template, link, now});
    H.assertMatch(name, /^[^\.\/]+$/);
  })


  it("getNameByLink: with httpMimeType", () => {
    const link = 'https://a.org/foo.bmp';
    const name = Asset.getNameByLink({
      template: template,
      link: link,
      mimeTypeData: {
        httpMimeType: 'image/jpeg',
        attrMimeType: 'image/png'
      },
      now
    });
    H.assertMatch(name, /^[^\.\/]+\.bmp$/);
  });

  it("getNameByLink: with attrMimeType", () => {
    const link = 'https://a.org/foo.bmp';
    const name = Asset.getNameByLink({
      template: template,
      link: link,
      mimeTypeData: {
        attrMimeType: 'image/png'
      },
      now
    });
    H.assertMatch(name, /^[^\.\/]+\.bmp$/);
  });

  it("getNameByLink: data link", () => {
    const link = 'data:image/png;base64,imagedata';
    const nameA = Asset.getNameByLink({
      template: template,
      link: link,
      mimeTypeData: {
        httpMimeType: 'image/jpeg'
      }
    });
    H.assertMatch(nameA, /^[^\.\/]+\.png$/);

    const nameB = Asset.getNameByLink({
      template: template,
      link: link,
      extension: 'ico'
    });
    H.assertMatch(nameB, /^[^\.\/]+\.png$/);
  });

});

