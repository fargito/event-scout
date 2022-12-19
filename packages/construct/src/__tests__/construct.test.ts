import { construct } from '../construct';

describe('construct', () => {
  it('should return "ok!"', () => {
    expect(construct()).toEqual('ok!');
  });
});
