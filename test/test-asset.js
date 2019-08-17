
const H = require('./helper.js');
const Asset = H.depJs('lib/asset.js');

describe("Asset", () => {

  it("getFilename", () => {
    const link = 'https://a.org/foo.jpg';
    const nameA = Asset.getFilename({link: link});
    H.assertMatch(nameA, /^[^\.\/]+\.jpg$/);

    const nameB = Asset.getFilename({link: link, mimeType: 'image/png'});
    H.assertMatch(nameB, /\.jpg$/);
  });

  it("getFilename with extension", () => {
    const link = 'https://a.org/foo.jpg';
    const name = Asset.getFilename({link: link, extension: 'txt'});
    H.assertMatch(name, /^[^\.\/]+\.txt$/);
  });

  it("getFilename with prefix", () => {
    const link = 'https://a.org/foo.jpg';
    const name = Asset.getFilename({link: link, prefix: '001'});
    H.assertMatch(name, /^001-[^\.\/]+\.jpg$/);
  });

  it("getFilename with mimeType", () => {
    const link = 'https://a.org/foo';
    const name = Asset.getFilename({link: link, mimeType: 'image/jpeg'});
    H.assertMatch(name, /^[^\.\/]+\.jpg$/);
  });

  it("getFilename - link doesn't has an extension", () => {
    const link = 'https://a.org/foo';
    const name = Asset.getFilename({link: link, mimeType: undefined});
    H.assertMatch(name, /^[^\.\/]+$/);
  })

  it("getFilename = data link", () => {
    const link = 'data:image/png;base64,imagedata';
    const nameA = Asset.getFilename({link: link, mimeType: 'image/jpeg'});
    H.assertMatch(nameA, /^[^\.\/]+\.png$/);

    const nameB = Asset.getFilename({link: link, extension: 'ico'});
    H.assertMatch(nameB, /^[^\.\/]+\.png$/);
  });

});

