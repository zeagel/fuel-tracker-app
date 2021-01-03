import React from 'react';
import { Input, Button } from 'semantic-ui-react';
import VehicleCoOwnerList from './VehicleCoOwnerList';

const VehicleCoOwnersBlock = ({
  delDisabled,
  coOwner,
  coOwners,
  handleDelCoOwnerOnClick,
  handleCoOwnerONChange,
  handleAddCoOwnerOnClick
}) => {

  return (
    <div>
      <div>
        <div className='row-label'>
          Ajoneuvon muut käyttäjät:
        </div>
        <VehicleCoOwnerList
          delDisabled={delDisabled}
          coOwners={coOwners}
          onClickHandler={handleDelCoOwnerOnClick}
        />
      </div>

      { // Only owner of vehicle is allowed to add new co-owners.
        delDisabled
          ? null
          :
          <div className='co-owner-container'>
            <Input
              className='co-owner-item'
              name='coOwner'
              type='text'
              value={coOwner}
              placeholder='Käyttäjätunnus'
              onChange={handleCoOwnerONChange}
            />
            <Button
              content='Lisää'
              disabled={!coOwner ? true : false}
              onClick={handleAddCoOwnerOnClick}
            />
          </div>
      }

    </div>
  );
};

export default VehicleCoOwnersBlock;