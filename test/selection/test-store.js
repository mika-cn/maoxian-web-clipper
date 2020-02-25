
const H = require('../helper.js');
const SelectionStore = H.depJs('selection/store.js');

describe('Selection Store', () => {

  const selection = {selector: 'S'};
  const selectionA = {selector: 'A'};
  const selectionB = {selector: 'B'};
  const selectionC = {selector: 'C'};
  let Store;

  it('first layer, root', () => {
    Store = SelectionStore.create();
    Store.set('/', selection);

    // @ROOT(S)
    H.assertEqual(Store.get('/')[0], selection);
    H.assertEqual(Store.get('/X').length, 0);
  });

  it('first layer, two different path', () => {
    Store = SelectionStore.create();
    Store.set('/A', selectionA);
    Store.set('/B', selectionB);

    // A(A)
    // B(B)
    H.assertEqual(Store.get('/A')[0], selectionA);
    H.assertEqual(Store.get('/B')[0], selectionB);
    H.assertEqual(Store.get('/C').length, 0);
  })

  it('first layer, selection change', () => {
    Store = SelectionStore.create();
    Store.set('/A', selectionA);
    // A(A)
    Store.set('/A', selection);
    // A(S)
    H.assertEqual(Store.get('/A')[0], selection);
  });

  it('first layer, one variable', () => {
    Store = SelectionStore.create();
    Store.set('/A', selection);
    Store.set('/B', selection);
    Store.set('/C', selectionC);

    // $VARIABLE(S)
    // C(C)
    H.assertEqual(Store.get('/X').length, 1);
    H.assertEqual(Store.get('/X')[0], selection);
    H.assertEqual(Store.get('/C').length, 1);
    H.assertEqual(Store.get('/C')[0], selectionC);
  });

  it('first layer, N variables', () => {
    Store = SelectionStore.create();
    Store.set('/A-1', selectionA);
    Store.set('/A-2', selectionA);
    Store.set('/B-1', selectionB);
    Store.set('/B-2', selectionB);
    Store.set('/C', selectionC);

    // $VARIABLE(A)
    // $VARIABLE(B)
    // C(C)
    H.assertEqual(Store.get('/X').length, 2);
    H.assertTrue(Store.get('/X').indexOf(selectionC) == -1);
    H.assertEqual(Store.get('/C').length, 1);
    H.assertEqual(Store.get('/C')[0], selectionC);
  });

  it('second layer, normal', () => {
    Store = SelectionStore.create();
    Store.set('/A/FileA', selectionA);

    // A/FileA(A)
    H.assertEqual(Store.get('/X/').length, 0)
  });

  it('second layer, has same name with a leaf node', () => {
    Store = SelectionStore.create();
    Store.set('/A', selection);
    Store.set('/A/File', selectionA);

    // A(S)
    // A/File(A)
    H.assertEqual(Store.get('/A').length, 1);
    H.assertEqual(Store.get('/A')[0], selection);
    H.assertEqual(Store.get('/A/X').length,1);
    H.assertEqual(Store.get('/A/X')[0], selectionA);
  });

  /*
    Generally is same page.
      /articleA/
      /articleB/
  */
  it('second layer, same selection', () => {
    Store = SelectionStore.create();
    Store.set('/A/', selection);
    // A/@ROOT(S)
    H.assertEqual(Store.get('/X/').length, 1);
    H.assertEqual(Store.get('/X/')[0], selection);

    Store.set('/B/', selection);
    // $VARIABLE/@ROOT(S)
    H.assertEqual(Store.get('/X/').length, 1);
    H.assertEqual(Store.get('/X/')[0], selection);
    H.assertEqual(Store.get('/X/FileX')[0], selection);
  });

  /*
    Generally is different page.
      /projectA/
      /projectB/
   */
  it('secound layer, different selection', () => {
    Store = SelectionStore.create();
    Store.set('/A/', selectionA);
    Store.set('/B/', selectionB);
    // A/@ROOT(A)
    // B/@ROOT(B)
    H.assertEqual(Store.get('/X/').length, 2);
  });


  it('second layer, selection changed', () => {
    Store = SelectionStore.create();
    Store.set('/A/FileA1', selectionA);
    Store.set('/A/FileA2', selectionA);
    // A/$VARIABLE(A)

    // selection changed
    Store.set('/A/FileA1', selection);
    Store.set('/A/FileA2', selection);

    // A/$VARIABLE(A)
    // A/$VARIABLE(S)
    H.assertEqual(Store.get('/A/X').length, 2);
  });

  it('second layer, selection changed, first layer is variable', () => {
    Store = SelectionStore.create();
    Store.set('/A1/File', selectionA);
    Store.set('/A2/File', selectionA);
    // $VARIABLE/File(A)

    // page changed
    Store.set('/A/File', selection);

    // $VARIABLE/File(S)
    H.assertEqual(Store.get('/X/File')[0], selection);
    H.assertEqual(Store.get('/X/FileX')[0], selection)
  });


  it('[addNode] middle layer, variable node followed by leaf node, same selection', () => {
    Store = SelectionStore.create();
    Store.set('/Fixed/A1/File', selection);
    Store.set('/Fixed/A2/File', selection);
    Store.set('/Fixed/B/FileB', selection);

    // Fixed/$VARIABLE/$VARIABLE(S)
    H.assertEqual(Store.get('/Fixed/X/FileX')[0], selection)
  });


  it('[addNode] middle layer, variable node is followed by leaf node, different selection', () => {
    Store = SelectionStore.create();
    Store.set('/Fixed/A1/File', selection);
    Store.set('/Fixed/A2/File', selection);
    Store.set('/Fixed/B/FileB', selectionB);

    // Fixed/$VARIABLE/File(S)
    // Fixed/B/FileB(B) (variable node wasn't applied)
    H.assertEqual(Store.get('/Fixed/B/FileX')[0], selectionB);
    H.assertEqual(Store.get('/Fixed/X/FileX')[0], selection)
  });



  it('middle layer different, N variables', () => {

    Store = SelectionStore.create();
    Store.set('/Fixed/A1/FileA', selectionA);
    Store.set('/Fixed/A2/FileA', selectionA);
    Store.set('/Fixed/B1/FileB', selectionB);
    Store.set('/Fixed/B2/FileB', selectionB);

    // Fixed/$VARIABLE/FileA(A)
    // Fixed/$VARIABLE/FileB(B)
    H.assertEqual(Store.get('/Fixed/X/FileA').length, 1);
    H.assertEqual(Store.get('/Fixed/X/FileA')[0], selectionA);
    H.assertEqual(Store.get('/Fixed/X/FileB').length, 1);
    H.assertEqual(Store.get('/Fixed/X/FileB')[0], selectionB);
    H.assertEqual(Store.get('/Fixed/X/FileX').length, 2);
  });

  it('middle and leaf are different, N variables', () => {
    Store = SelectionStore.create();
    Store.set('/Fixed/A1/FileA1', selectionA);
    Store.set('/Fixed/A2/FileA2', selectionA);
    Store.set('/Fixed/B1/FileB1', selectionB);
    Store.set('/Fixed/B2/FileB2', selectionB);

    // Fixed/$VARIABLE/$VARIABLE(A)
    // Fixed/$VARIABLE/$VARIABLE(B)
    H.assertEqual(Store.get('/Fixed/X/FixeX').length, 2);
  });

  it('should not merge branch with different length', () => {
    Store = SelectionStore.create();
    Store.set('/Fixed/A/B', selection);
    Store.set('/Fixed/A/a1/File', selectionA);
    Store.set('/Fixed/A/a2/File', selectionA);
    // Fixed/A/B(S)
    // Fixed/A/$VARIABLE/File(A)
    H.assertEqual(Store.get('/Fixed/A/x').length, 1)
    H.assertEqual(Store.get('/Fixed/A/x')[0], selection)
  });


  it('should merge branch', () => {
    Store = SelectionStore.create();
    Store.set('/Fixed/A/a1/File', selectionA);
    Store.set('/Fixed/A/a2/File', selectionA);
    Store.set('/Fixed/B/b1/File', selectionB);
    Store.set('/Fixed/B/b2/File', selectionB);

    // Fixed/A/$VARIABLE/File(A)
    // Fixed/B/$VARIABLE/File(B)
    // NOT merged
    H.assertEqual(Store.get('/Fixed/A/x/File')[0], selectionA);
    H.assertEqual(Store.get('/Fixed/B/x/File')[0], selectionB);
    H.assertEqual(Store.get('/Fixed/X/x/File').length, 0)

    // ------------

    Store = SelectionStore.create();
    Store.set('/Fixed/A/a1/File', selection);
    Store.set('/Fixed/A/a2/File', selection);
    Store.set('/Fixed/B/b1/File', selection);
    Store.set('/Fixed/B/b2/File', selection);
    // Fixed/$VARIABLE/$VARIABLE(S)
    // merged
    H.assertEqual(Store.get('/Fixed/X/x/File').length, 1)
    H.assertEqual(Store.get('/Fixed/X/x/File')[0], selection)
  });

})
