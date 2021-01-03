import React from 'react';
import { Icon } from 'semantic-ui-react';

const VehicleCoOwnerList = ({ coOwners, onClickHandler, delDisabled }) => {

  if (!coOwners || coOwners.length === 0) {
    return (
      <div>
        Ajoneuvolla ei muita käyttäjiä
      </div>
    );
  }

  const coOwnerTags = coOwners.map(c => {
    return (
      <div key={c.id} className={'co-owner-tag-item'.concat(delDisabled ? ' del-disabled' : '')}>
        <div>{c.name}</div>
        { // Only owner of vehicle is allowed to remove co-owners.
          delDisabled
            ? null
            : <div><Icon name='delete' color='grey' onClick={() => onClickHandler(c)} /></div>
        }
      </div>
    );
  });

  return (
    <div className='co-owner-tag-container'>
      {coOwnerTags}
    </div>
  );
};

export default VehicleCoOwnerList;