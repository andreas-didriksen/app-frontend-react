import React from 'react';

import { screen } from '@testing-library/react';

import { App } from 'src/App';
import { renderWithProviders } from 'src/test/renderWithProviders';

describe('App', () => {
  test('should render unknown error when hasApplicationSettingsError', async () => {
    const queries = {
      fetchApplicationSettings: () => Promise.reject(new Error('400 Bad Request')),
    };
    renderWithProviders(<App />, {}, queries);
    await screen.findByRole('heading', { level: 1, name: 'Ukjent feil' });
  });

  test('should render unknown error when hasApplicationMetadataError', async () => {
    const queries = {
      fetchApplicationMetadata: () => Promise.reject(new Error('400 Bad Request')),
    };
    renderWithProviders(<App />, {}, queries);
    await screen.findByRole('heading', { level: 1, name: 'Ukjent feil' });
  });

  test('should render unknown error when hasLayoutSetError', async () => {
    const queries = {
      fetchLayoutSets: () => Promise.reject(new Error('400 Bad Request')),
    };
    renderWithProviders(<App />, {}, queries);
    await screen.findByRole('heading', { level: 1, name: 'Ukjent feil' });
  });

  test('should render unknown error when hasOrgsError', async () => {
    const queries = {
      fetchOrgs: () => Promise.reject(new Error('400 Bad Request')),
    };
    renderWithProviders(<App />, {}, queries);
    await screen.findByRole('heading', { level: 1, name: 'Ukjent feil' });
  });
});
