import { useState } from 'react';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
import { Stack } from '@astryxdesign/core/Stack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Banner } from '@astryxdesign/core/Banner';

export interface FormFieldSpec {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'textarea';
  placeholder?: string;
  description?: string;
  isRequired?: boolean;
  /** Return an error message, or null when valid. */
  validate?: (value: string) => string | null;
}

/**
 * A validated form panel.
 *
 * Validation runs on submit and on change *after* a field has been touched —
 * validating an untouched field shouts at someone for not having typed yet.
 * TextInput takes `label` and `status` directly, so no Field wrapper is
 * needed and no label is rendered twice.
 */
export function FormPanel({
  title,
  fields,
  submitLabel = 'Save',
  onSubmit,
}: {
  title?: string;
  fields: ReadonlyArray<FormFieldSpec>;
  submitLabel?: string;
  onSubmit?: (values: Record<string, string>) => Promise<void> | void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, ''])),
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validateField = (field: FormFieldSpec, value: string): string | null => {
    if (field.isRequired && value.trim() === '') return `${field.label} is required`;
    return field.validate?.(value) ?? null;
  };

  const handleChange = (field: FormFieldSpec, value: string) => {
    setValues((v) => ({ ...v, [field.name]: value }));
    if (touched[field.name]) {
      const err = validateField(field, value);
      setErrors((e) => ({ ...e, [field.name]: err ?? '' }));
    }
  };

  const handleBlur = (field: FormFieldSpec) => {
    setTouched((t) => ({ ...t, [field.name]: true }));
    const err = validateField(field, values[field.name] ?? '');
    setErrors((e) => ({ ...e, [field.name]: err ?? '' }));
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      const err = validateField(field, values[field.name] ?? '');
      if (err) nextErrors[field.name] = err;
    }
    setErrors(nextErrors);
    setTouched(Object.fromEntries(fields.map((f) => [f.name, true])));

    if (Object.keys(nextErrors).length > 0) {
      setBanner({ type: 'error', text: 'Please fix the highlighted fields.' });
      return;
    }

    setBanner(null);
    setSubmitting(true);
    try {
      await onSubmit?.(values);
      setBanner({ type: 'success', text: 'Saved.' });
    } catch (err) {
      setBanner({ type: 'error', text: err instanceof Error ? err.message : 'Something broke.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding={6} maxWidth={620}>
      <Stack direction="vertical" gap={4}>
        {title && <Heading level={2}>{title}</Heading>}

        {banner && (
          <Banner
            status={banner.type}
            title={banner.text}
            isDismissable
            onDismiss={() => setBanner(null)}
          />
        )}

        <FormLayout>
          {fields.map((field) => {
            const error = touched[field.name] ? errors[field.name] : '';
            const status = error ? ({ type: 'error', message: error } as const) : undefined;
            const common = {
              label: field.label,
              value: values[field.name] ?? '',
              description: field.description,
              isRequired: field.isRequired,
              placeholder: field.placeholder,
              status,
              onBlur: () => handleBlur(field),
            };

            return field.type === 'textarea' ? (
              <TextArea
                key={field.name}
                {...common}
                onChange={(v: string) => handleChange(field, v)}
              />
            ) : (
              <TextInput
                key={field.name}
                {...common}
                type={field.type === 'email' || field.type === 'password' ? field.type : 'text'}
                onChange={(v: string) => handleChange(field, v)}
              />
            );
          })}
        </FormLayout>

        <Stack direction="horizontal" gap={2}>
          <Button
            label={submitLabel}
            variant="primary"
            isLoading={submitting}
            onClick={handleSubmit}
          />
        </Stack>
      </Stack>
    </Card>
  );
}
