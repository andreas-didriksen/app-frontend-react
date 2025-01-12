import React from 'react';

import { screen } from '@testing-library/react';

import { getFormDataStateMock } from 'src/__mocks__/formDataStateMock';
import { getFormLayoutStateMock } from 'src/__mocks__/formLayoutStateMock';
import { getInitialStateMock } from 'src/__mocks__/initialStateMock';
import { GenericComponent } from 'src/layout/GenericComponent';
import { renderWithProviders } from 'src/test/renderWithProviders';
import { useResolvedNode } from 'src/utils/layout/ExprContext';
import type { CompExternal } from 'src/layout/layout';

const render = (props: Partial<CompExternal> = {}) => {
  const formLayout = getFormLayoutStateMock({
    layouts: {
      FormLayout: [
        {
          type: 'Input',
          id: 'mockId',
          dataModelBindings: {
            simpleBinding: 'mockDataBinding',
          },
          readOnly: false,
          required: false,
          disabled: false,
          textResourceBindings: {},
          triggers: [],
          grid: {
            xs: 12,
            sm: 10,
            md: 8,
            lg: 6,
            xl: 4,
            innerGrid: {
              xs: 11,
              sm: 9,
              md: 7,
              lg: 5,
              xl: 3,
            },
          },
          ...(props as any),
        },
      ],
    },
  });

  const formData = getFormDataStateMock({
    formData: {
      mockDataBinding: 'value',
    },
  });

  const Wrapper = () => {
    const node = useResolvedNode('mockId');
    return node ? <GenericComponent node={node} /> : null;
  };

  return renderWithProviders(<Wrapper />, {
    preloadedState: {
      ...getInitialStateMock(),
      formLayout,
      formData,
    },
  });
};

describe('GenericComponent', () => {
  it('should show an error in the logs when rendering an unknown component type', () => {
    const spy = jest.spyOn(window, 'logWarnOnce').mockImplementation();
    const { container } = render({ type: 'unknown-type' } as any);

    expect(spy).toHaveBeenCalledWith(`No component definition found for type 'unknown-type'`);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render Input component when passing Input type', () => {
    render({ type: 'Input' });

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText(/unknown component type/i)).not.toBeInTheDocument();
  });

  it('should render description and label when textResourceBindings includes description and title', () => {
    render({
      type: 'Input',
      textResourceBindings: {
        title: 'titleKey',
        description: 'descriptionKey',
      },
    });

    expect(screen.getByTestId('description-mockId')).toBeInTheDocument();
    expect(screen.getByTestId('label-mockId')).toBeInTheDocument();
  });

  it('should not render description and label when textResourceBindings does not include description and title', () => {
    render({
      type: 'Input',
      textResourceBindings: {},
    });

    expect(screen.queryByTestId('description-mockId')).not.toBeInTheDocument();
    expect(screen.queryByTestId('label-mockId')).not.toBeInTheDocument();
  });

  it('should not render description and label when textResourceBindings includes description and title, but the component is listed in "noLabelComponents"', () => {
    render({
      type: 'NavigationBar',
      textResourceBindings: {
        title: 'titleKey',
        description: 'descriptionKey',
      },
    } as any);

    expect(screen.queryByTestId('description-mockId')).not.toBeInTheDocument();
    expect(screen.queryByTestId('label-mockId')).not.toBeInTheDocument();
  });
});
