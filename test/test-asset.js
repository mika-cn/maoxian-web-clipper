
const H = require('./helper.js');
const Asset = H.depJs('lib/asset.js');

describe("Asset", () => {

  it("getNameByLink: link only", () => {
    const link = 'https://a.org/foo.jpg';
    const nameA = Asset.getNameByLink({link: link});
    H.assertMatch(nameA, /^[^\.\/]+\.jpg$/);
  });

  it("getNameByLink: with extension", () => {
    const link = 'https://a.org/foo.jpg';
    const name = Asset.getNameByLink({link: link, extension: 'txt'});
    H.assertMatch(name, /^[^\.\/]+\.txt$/);
  });

  it("getNameByLink: link doesn't has an extension", () => {
    const link = 'https://a.org/foo';
    const name = Asset.getNameByLink({link: link});
    H.assertMatch(name, /^[^\.\/]+$/);
  })


  it("getNameByLink: with prefix", () => {
    const link = 'https://a.org/foo.jpg';
    const name = Asset.getNameByLink({link: link, prefix: '001'});
    H.assertMatch(name, /^001-[^\.\/]+\.jpg$/);
  });

  it("getNameByLink: with httpMimeType", () => {
    const link = 'https://a.org/foo.bmp';
    const name = Asset.getNameByLink({link: link, mimeTypeData: {
      httpMimeType: 'image/jpeg',
      attrMimeType: 'image/png'
    }});
    H.assertMatch(name, /^[^\.\/]+\.jpg$/);
  });

  it("getNameByLink: with attrMimeType", () => {
    const link = 'https://a.org/foo.bmp';
    const name = Asset.getNameByLink({link: link, mimeTypeData: {
      attrMimeType: 'image/png'
    }});
    H.assertMatch(name, /^[^\.\/]+\.bmp$/);
  });

  it("getNameByLink: data link", () => {
    const link = 'data:image/png;base64,imagedata';
    const nameA = Asset.getNameByLink({link: link, mimeTypeData: {
      httpMimeType: 'image/jpeg'
    }});
    H.assertMatch(nameA, /^[^\.\/]+\.png$/);

    const nameB = Asset.getNameByLink({link: link, extension: 'ico'});
    H.assertMatch(nameB, /^[^\.\/]+\.png$/);
  });

  it("getPath - assetRelativePath: assets", () => {
    const storageInfo = { assetRelativePath: 'assets' };
    const assetName = "A.jpeg";
    const path = Asset.getPath({storageInfo, assetName});
    H.assertMatch(path, 'assets/A.jpeg')
  });

  it("getPath - assetRelativePath: ../../assets", () => {
    const storageInfo = { assetRelativePath: '../../assets' };
    const assetName = "A.jpeg";
    const path = Asset.getPath({storageInfo, assetName});
    H.assertMatch(path, '../../assets/A.jpeg')
  });

  it("getPath - assetRelativePath: empty string", () => {
    const storageInfo = { assetRelativePath: '' };
    const assetName = 'A.jpeg';
    const path = Asset.getPath({storageInfo, assetName});
    H.assertMatch(path, assetName);
  });

});

