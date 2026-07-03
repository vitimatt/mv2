'use client';

import { definePlugin, type StringInputProps } from 'sanity';
import { PasswordInput } from '../components/PasswordInput';

function isCollectionPasswordField(props: StringInputProps) {
  return (
    props.schemaType.name === 'string' &&
    props.path.length === 1 &&
    props.path[0] === 'password'
  );
}

export const passwordFieldPlugin = definePlugin({
  name: 'password-field',
  form: {
    components: {
      input: (props) => {
        if (isCollectionPasswordField(props as StringInputProps)) {
          return <PasswordInput {...(props as StringInputProps)} />;
        }

        return props.renderDefault(props);
      },
    },
  },
});
