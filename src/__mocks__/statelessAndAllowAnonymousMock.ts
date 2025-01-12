import { getInitialStateMock } from 'src/__mocks__/initialStateMock';
import type { IApplicationMetadata } from 'src/features/applicationMetadata';
import type { IRuntimeState } from 'src/types';

export const statelessAndAllowAnonymousMock = (allowAnonymous: boolean | undefined) => {
  const initialState = getInitialStateMock();
  const initialAppMetadata: IApplicationMetadata = {
    ...(initialState.applicationMetadata.applicationMetadata as IApplicationMetadata),
    onEntry: {
      show: 'stateless',
    },
  };
  if (initialAppMetadata.dataTypes[0].appLogic) {
    initialAppMetadata.dataTypes[0].appLogic.allowAnonymousOnStateless = allowAnonymous;
  }
  const mockInitialState: IRuntimeState = {
    ...initialState,
    applicationMetadata: {
      applicationMetadata: initialAppMetadata,
      error: null,
    },
    formLayout: {
      ...initialState.formLayout,
      layoutsets: {
        sets: [
          {
            id: 'stateless',
            dataType: 'test-data-model',
          },
        ],
      },
    },
  };
  return mockInitialState;
};
