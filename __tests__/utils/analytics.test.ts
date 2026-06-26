import { getActiveRouteName, trackEvent, trackScreen } from '../../src/utils/analytics';

describe('analytics', () => {
  it('logs screen and event calls in development', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    trackScreen('CommunityList');
    trackEvent('login_success');

    expect(log).toHaveBeenCalledWith('[Analytics] screen: CommunityList', {});
    expect(log).toHaveBeenCalledWith('[Analytics] event: login_success', {});

    log.mockRestore();
  });

  it('returns the deepest active route name', () => {
    const state = {
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            index: 1,
            routes: [{ name: 'CommunityList' }, { name: 'CommunityDetail' }],
          },
        },
      ],
    };

    expect(getActiveRouteName(state)).toBe('CommunityDetail');
  });
});
