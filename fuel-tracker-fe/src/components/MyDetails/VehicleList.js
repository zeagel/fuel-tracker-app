import React from 'react';
import EditVehicleModal from './EditVehicleModal';

const VehicleList = ({ user, users }) => {

  if (Object.keys(user).length === 0) {
    return null;
  }

  if (user.vehicles.length === 0) {
    return (
      <div className='my-details-row'>
        Ei ajoneuvoja
      </div>
    );
  }

  // Sort vehicle by name in alphabetical descending order.
  user.vehicles.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className='my-details-row' >
        {
          user.vehicles.map((v, i) => {
            return <EditVehicleModal
              key={v.id}
              vehicle={v}
              user={user}
              users={users}
            />;
          })
        }
      </div>
    </>
  );
};

export default VehicleList;