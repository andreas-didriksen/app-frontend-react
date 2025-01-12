import React from 'react';

import { ErrorMessage } from '@digdir/design-system-react';

import { SoftValidations } from 'src/components/form/SoftValidations';
import { getParsedLanguageFromText } from 'src/language/sharedLanguage';
import type { IComponentBindingValidation } from 'src/utils/validation/types';

export function renderValidationMessagesForComponent(
  validationMessages: IComponentBindingValidation | undefined | null,
  id: string,
): JSX.Element[] | null {
  if (!validationMessages) {
    return null;
  }
  const validationMessageElements: JSX.Element[] = [];
  if (validationMessages.errors && validationMessages.errors.length > 0) {
    validationMessageElements.push(renderValidationMessages(validationMessages.errors, `error_${id}`, 'error'));
  }

  if (validationMessages.warnings && validationMessages.warnings.length > 0) {
    validationMessageElements.push(renderValidationMessages(validationMessages.warnings, `warning_${id}`, 'warning'));
  }

  if (validationMessages.info && validationMessages.info.length > 0) {
    validationMessageElements.push(renderValidationMessages(validationMessages.info, `info_${id}`, 'info'));
  }

  if (validationMessages.success && validationMessages.success.length > 0) {
    validationMessageElements.push(renderValidationMessages(validationMessages.success, `success_${id}`, 'success'));
  }

  return validationMessageElements.length > 0 ? validationMessageElements : null;
}

export function renderValidationMessages(
  messages: string[],
  id: string,
  variant: 'error' | 'warning' | 'info' | 'success',
) {
  if (variant !== 'error') {
    return (
      <div style={{ paddingTop: 'var(--fds-spacing-2)' }}>
        <SoftValidations
          variant={variant}
          key={id}
          errorMessages={messages}
        />
      </div>
    );
  }

  return (
    <div
      style={{ paddingTop: '0.375rem' }}
      key={id}
    >
      <ErrorMessage
        size='small'
        id={id}
      >
        <ol style={{ padding: 0, margin: 0 }}>{messages.map(validationMessagesToList)}</ol>
      </ErrorMessage>
    </div>
  );
}

const validationMessagesToList = (message: string, index: number) => (
  <li
    role='alert'
    key={`validationMessage-${index}`}
  >
    {getParsedLanguageFromText(message)}
  </li>
);
