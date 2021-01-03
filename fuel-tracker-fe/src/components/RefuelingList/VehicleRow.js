import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Grid, Icon, Divider } from 'semantic-ui-react';
import { setRefuelingEntry } from '../../reducers/refuelingReducer';
import { toggleListState } from '../../reducers/listStateReducer';
import useWindowDimensions from '../../hooks';
import AddRefuelingModal from './AddRefuelingModal';

const VehicleRow = ({ vehicle, primary, listStates, user }) => {
  const [showRefuelingEntries, setShowRefuelingEntries] = useState(false);
  const { width } = useWindowDimensions();

  const dispatch = useDispatch();

  useEffect(() => {
    if (listStates && listStates.length > 0) {
      const result = listStates.find(item => item.id === vehicle.id);
      if (result && result.state === 'open') {
        setShowRefuelingEntries(true);
      }
    }
  }, [listStates, vehicle.id]);

  const getFormattedDateString = (date) => {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return d.toLocaleDateString('fi-FI', options);
  };

  // If value is round figure, use only one decimal.
  // Otherwise, use two decimals.
  const getDecimalFormattedValue = (value) => {
    if (value % 1 === 0) {
      return value.toFixed(1);
    } else {
      return value.toFixed(2);
    }
  };

  const handleRowOnClick = () => {
    showRefuelingEntries ? setShowRefuelingEntries(false) : setShowRefuelingEntries(true);
    dispatch(toggleListState(vehicle.id));
  };

  const RefuelingLabelRow = () => {

    if (vehicle.refuelings.length === 0) {
      return null;
    }

    // Limit displayed columns with smaller screens
    // in order to keep the UI layout intact.
    if (Number(width) < 550) {
      return (
        <Grid.Row className='refueling-title-row' columns={3}>
          <Grid.Column>
            Pvm
          </Grid.Column>
          <Grid.Column>
            Trippi
          </Grid.Column>
          <Grid.Column>
            KA. kulutus
          </Grid.Column>
        </Grid.Row>
      );

    // With larger screen sizes, all columns can be displayed.
    } else {
      return (
        <Grid.Row className='refueling-title-row' columns={6}>
          <Grid.Column>
            Tankkaaja
          </Grid.Column>
          <Grid.Column>
            Pvm
          </Grid.Column>
          <Grid.Column>
            Matkamittari
          </Grid.Column>
          <Grid.Column>
            Litrat
          </Grid.Column>
          <Grid.Column>
            Trippi
          </Grid.Column>
          <Grid.Column>
            KA. kulutus
          </Grid.Column>
        </Grid.Row>
      );
    }
  };

  const RefuelingEntryRow = () => {
    if (vehicle.refuelings.length === 0) {
      return (
        <Grid.Row>
          <Grid.Column colSpan={6}>
            Ei kirjattuja tankkauksia
          </Grid.Column>
        </Grid.Row>
      );
    }

    return vehicle.refuelings.map((refueling, index) => {

      // Smaller screen -> limit columns
      if (Number(width) < 550) {
        return (
          <Grid.Row
            className={index % 2 === 0 ? 'refueling-entry-row' : 'refueling-entry-row hl-row'}
            columns={3}
            key={refueling.id}
            onClick={() => dispatch(setRefuelingEntry(refueling))}
          >
            <Grid.Column>
              {getFormattedDateString(refueling.date)}
            </Grid.Column>
            <Grid.Column>
              {refueling.tripKilometers}
            </Grid.Column>
            <Grid.Column>
              {getDecimalFormattedValue(refueling.avgConsumption)}
            </Grid.Column>
          </Grid.Row>
        );

      // Larger screen -> no need to limit columns.
      } else {
        return (
          <Grid.Row
            className={index % 2 === 0 ? 'refueling-entry-row' : 'refueling-entry-row hl-row'}
            columns={6}
            key={refueling.id}
            onClick={() => dispatch(setRefuelingEntry(refueling))}
          >
            <Grid.Column>
              {refueling.user.name}
            </Grid.Column>
            <Grid.Column>
              {getFormattedDateString(refueling.date)}
            </Grid.Column>
            <Grid.Column>
              {refueling.odoMeter}
            </Grid.Column>
            <Grid.Column>
              {getDecimalFormattedValue(refueling.liters)}
            </Grid.Column>
            <Grid.Column>
              {refueling.tripKilometers}
            </Grid.Column>
            <Grid.Column>
              {getDecimalFormattedValue(refueling.avgConsumption)}
            </Grid.Column>
          </Grid.Row>
        );
      }

    });
  };

  // Sort refueling entries by date in descending order by default.
  vehicle.refuelings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <Grid>
        <Grid.Row className='vehicle-title-row' columns={6}>
          <Grid.Column className='cursor-pointer' textAlign='left' width={8} onClick={handleRowOnClick}>
            {primary === vehicle.id ? <Icon className='primary-vehicle-icon' name='star' /> : null}
            {vehicle.name}
          </Grid.Column>
          <Grid.Column textAlign='right' width={8} className='vehicle-title-row-right-column'>
            <AddRefuelingModal vehicle={vehicle} user={user} />
            <Icon
              name={showRefuelingEntries ? 'angle up' : 'angle down'}
              onClick={handleRowOnClick}
              className='cursor-pointer'
            />
          </Grid.Column>
        </Grid.Row>

        { // Display refueling entries only if refueling list is opened.
          showRefuelingEntries
            ?
            <>
              <RefuelingLabelRow />
              <RefuelingEntryRow />
            </>
            : null
        }

        <Divider />
      </Grid>
    </>
  );
};

export default VehicleRow;