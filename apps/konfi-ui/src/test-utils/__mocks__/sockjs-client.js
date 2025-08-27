export default jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
}));
