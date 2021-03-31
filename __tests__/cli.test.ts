describe('Given a mocked runner', () => {
  beforeEach(() => {
    jest.doMock('../src/index');
  });

  afterEach(() => {
    jest.dontMock('../src/index');
  });

  test('then, importing cli calles runner', async () => {
    await import('../src/cli');
    const {default: run} = await import('../src/index');
    expect(run).toBeCalled();
  });
});
