import React from 'react';
import { Input } from 'semantic-ui-react';

const VehicleInputBlock = ({
  label,
  name,
  value,
  disabled,
  onChange,
  blockStyle,
  onBlur,
  inputError
}) => {

  return (
    <div className={blockStyle}>
      <div className='row-label'>
        {label}
      </div>
      <Input
        className={'add-vehicle-input'.concat(inputError ? ' error' : '')}
        name={name}
        type='text'
        value={value}
        disabled={disabled}
        onChange={onChange}
        onBlur={onBlur}
      />
    </div>
  );
};

export default VehicleInputBlock;