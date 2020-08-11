
import { toPx } from '../src/util';

describe('Util', () => {
  it('Should take a number and turn it into px CSS string', () => {
    expect(toPx(123)).toEqual('123px');
  });
});
