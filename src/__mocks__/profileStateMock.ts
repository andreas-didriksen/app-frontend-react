import { partyMock } from 'src/__mocks__/partyMock';
import type { IProfileState } from 'src/features/profile';

export function getProfileStateMock(customStates?: Partial<IProfileState>): IProfileState {
  const profileStateMock = {
    error: null,
    profile: {
      userId: 12345,
      userName: 'Ola Normann',
      partyId: 12345,
      party: partyMock,
      userType: 1,
      profileSettingPreference: {
        language: 'nb',
        preSelectedPartyId: 12345,
        doNotPromptForParty: false,
      },
    },
    selectedAppLanguage: '',
  };

  return {
    ...profileStateMock,
    ...customStates,
  };
}
