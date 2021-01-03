import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Modal, Grid, Segment, Input, Icon, Message } from 'semantic-ui-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addDays } from 'date-fns';
import { addRefueling } from '../../reducers/userReducer';
import { clearNotification } from '../../reducers/notificationReducer';

const AddRefuelingModal = ({ vehicle }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState('');
  const [odoMeter, setOdoMeter] = useState('');
  const [liters, setLiters] = useState('');
  const [trip, setTrip] = useState('');
  const [avgConsumption, setAvgConsumption] = useState('');
  const [addEndOfList, setAddEndOfList] = useState(true);
  const [faultyOdoMeter, setFaultyOdoMeter] = useState({ state: false, text: '' });
  const [faultyLiters, setFaultyLiters] = useState({ state: false, text: '' });
  const [faultyTrip, setFaultyTrip] = useState({ state: false, text: '' });
  const [latestRefueling, setLatestRefueling] = useState(undefined);
  const dispatch = useDispatch();

  useEffect(() => {
    // Store previous odometer value for the later logic in the component.
    if (vehicle) {
      if (vehicle.refuelings.length > 0) {
        vehicle.refuelings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLatestRefueling(vehicle.refuelings[0]);
      } else {
        setLatestRefueling({ odoMeter: vehicle.odoMeter });
      }
    }

    // Set the datepicker date value on the current day by default.
    if (!date) {
      setDate(new Date());
    }

  },[vehicle, date]);

  // Aux function to reset all local storeges of the component.
  const resetAllStates = () => {
    setDate('');
    setOdoMeter('');
    setLiters('');
    setTrip('');
    setAvgConsumption('');
    setFaultyOdoMeter({ state: false, text: '' });
    setFaultyLiters({ state: false, text: '' });
    setFaultyTrip({ state: false, text: '' });
    setAddEndOfList(true);
  };

  const handleCancelOnClick = () => {
    resetAllStates();
    setModalOpen(false);
  };

  const handleResetOnClick = () => {
    resetAllStates();
  };

  const handleDateOnChange = (val) => {
    setOdoMeter('');
    setLiters('');
    setTrip('');
    setAvgConsumption('');

    // Identify, based on previous refueling and selected date,
    // what is the refueling type (addEnd, addMiddle). This effects
    // to the logic how the new refueling entry is stored.
    if (latestRefueling && new Date(val).getTime() < new Date(latestRefueling.date)) {
      setAddEndOfList(false);
    } else {
      setAddEndOfList(true);
    }

    setDate(val);
  };

  // Aux function to identify is the new refueling entry ready
  // for saving. This dictates is the SAVE button enabled or disabled.
  const isEntryReadyForSave = () => {
    if (addEndOfList && (
      odoMeter && !faultyOdoMeter.state &&
      liters && !faultyLiters.state
    )) {
      return true;
    } else if (!addEndOfList && (
      liters && !faultyLiters.state &&
      trip && !faultyTrip.state
    )){
      return true;
    }

    return false;
  };

  // Validator function for odometer input field.
  const handleOdoMeterOnBlur = () => {
    setFaultyOdoMeter({ state: false, text: '' });

    if (!odoMeter) {
      setFaultyOdoMeter({ state: true, text: 'Kenttä ei saa olla tyhjä.' });
    } else if (!Number.isInteger(Number(odoMeter))) {
      setFaultyOdoMeter({ state: true, text: 'Arvon tulee olla kokonaisluku.' });
    } else if (latestRefueling && odoMeter <= latestRefueling.odoMeter) {
      setFaultyOdoMeter({ state: true, text: `Arvon tulee olla suurempi kuin aiempi matkamittarin lukema (${latestRefueling.odoMeter}).` });
    } else {
      const newTrip = odoMeter - latestRefueling.odoMeter;
      setTrip(newTrip);
      if (liters && !faultyLiters.state) {
        setAvgConsumption(((liters / newTrip) * 100).toFixed(2));
      }
    }
  };

  // Validator function for liters input field.
  const handleLitersOnBlur = () => {
    setFaultyLiters(false);

    if (!liters) {
      setFaultyLiters({ state: true, text: 'Kenttä ei saa olla tyhjä.' });
    } else if (isNaN(liters)) {
      setFaultyLiters({ state: true, text: 'Arvon tulee olla numeerinen.' });
    } else if (liters <= 0) {
      setFaultyLiters({ state: true, text: 'Arvon tulee olla nollaa suurempi.' });
    } else {
      if (trip && !faultyTrip.state) {
        setAvgConsumption(((liters / trip) * 100).toFixed(2));
      }
    }
  };

  // Validator function for trip input field.
  const handleTripOnBlur = () => {
    setFaultyTrip(false);

    if (!trip) {
      setFaultyTrip({ state: true, text: 'Kenttä ei saa olla tyhjä.' });
    } else if (isNaN(trip)) {
      setFaultyTrip({ state: true, text: 'Arvon tulee olla numeerinen.' });
    } else if (trip <= 0) {
      setFaultyTrip({ state: true, text: 'Arvon tulee olla nollaa suurempi.' });
    } else {
      if (liters && !faultyOdoMeter.state) {
        setAvgConsumption(((liters / trip) * 100).toFixed(2));
      }
    }
  };

  // Dispatch/POST new refueling request for the server,
  // clear all local states of the modal and close it.
  const handleSaveOnClick = () => {
    const newRefuelingEntry = {
      refueling: {
        type: addEndOfList ? 'addEnd' : 'addMiddle',
        vehicle: vehicle.id,
        date,
        odoMeter,
        liters,
        trip,
        avgConsumption
      }
    };

    dispatch(addRefueling(newRefuelingEntry));

    resetAllStates();
    setModalOpen(false);
  };

  return (
    <>
      <Modal
        closeIcon={true}
        onClose={() => handleCancelOnClick()}
        onOpen={() => setModalOpen(true)}
        open={modalOpen}
        closeOnDimmerClick={false}
        closeOnEscape={false}
        size='tiny'
        trigger={
          <div
            className='add-new-link'
            onClick={() => dispatch(clearNotification())}
          >
            <Icon name='add' />
            Lisää tankkaus
          </div>}
      >
        <Modal.Header>Lisää uusi tankkaus</Modal.Header>
        <Modal.Content>
          <Grid textAlign='center' verticalAlign='top'>
            <Grid.Column style={{ maxWidth: 400 }}>
              <Segment raised>

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    Ajoneuvo:
                  </div>
                  <Input
                    className='refueling-input'
                    name='vehicle'
                    type='text'
                    value={`${vehicle.name} (${vehicle.licensePlateId})`}
                    fluid={true}
                    disabled={true}
                  />
                </div>

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    Päivämäärä:
                  </div>
                  <DatePicker
                    className='refueling-input dp-custom editable'
                    value={date}
                    selected={date}
                    dateFormat='d.M.yyyy'
                    onChange={val => handleDateOnChange(val)}
                    // By preventing default action of onChangeRaw
                    // we disable keyboard input on DatePicker. The date
                    // value can be set only by selecting it.
                    onChangeRaw={(e) => e.preventDefault()}
                    maxDate={addDays(new Date(), 0)}
                  />
                </div>

                {
                  !addEndOfList
                    ? null
                    :
                    <>
                      <div className='refueling-input-block'>
                        <div className='row-label'>
                          Matkamittari:
                        </div>
                        <Input
                          className={'refueling-input'
                            .concat(faultyOdoMeter.state ? ' error' : ' editable')
                          }
                          name='odoMeter'
                          type='text'
                          placeholder={`Anna kilometrit (aiempi: ${vehicle.odoMeter})`}
                          value={odoMeter}
                          fluid={true}
                          onChange={(e) => setOdoMeter(e.target.value)}
                          onBlur={() => handleOdoMeterOnBlur()}
                        />
                        {
                          faultyOdoMeter.state
                            ? <Message error content={faultyOdoMeter.text} />
                            : null
                        }
                      </div>
                    </>
                }

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    Litrat:
                  </div>
                  <Input
                    className={'refueling-input'
                      .concat(faultyLiters.state ? ' error' : ' editable')
                    }
                    name='liters'
                    type='text'
                    placeholder='Anna litrat'
                    value={liters}
                    fluid={true}
                    onChange={(e) => setLiters(e.target.value)}
                    onBlur={handleLitersOnBlur}
                  />
                  {
                    faultyLiters.state
                      ? <Message error content={faultyLiters.text} />
                      : null
                  }
                </div>

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    Trippi:
                  </div>
                  <Input
                    className={'refueling-input'
                      .concat(!addEndOfList ? ' editable' : '')
                      .concat(faultyTrip.state ? ' error' : '')
                    }
                    name='trip'
                    type='text'
                    placeholder={!addEndOfList ? 'Anna kilometrit' : 'ei vielä laskettavissa'}
                    value={trip}
                    fluid={true}
                    onChange={(e) => setTrip(e.target.value)}
                    onBlur={handleTripOnBlur}
                    disabled={addEndOfList}
                  />
                  {
                    faultyTrip.state
                      ? <Message error content={faultyTrip.text} />
                      : null
                  }
                </div>

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    KA. kulutus:
                  </div>
                  <Input
                    className='refueling-input'
                    name='avgConsumption'
                    type='text'
                    placeholder='ei vielä laskettavissa'
                    value={avgConsumption}
                    fluid={true}
                    onChange={(e) => setAvgConsumption(e.target.value)}
                    disabled={true}
                  />
                </div>

              </Segment>

            </Grid.Column>
          </Grid>
        </Modal.Content>
        <Modal.Actions className='refueling-modal-actions'>
          <Button
            color='black'
            content='Peruuta'
            icon='cancel'
            onClick={() => handleCancelOnClick()}
          />

          <Button
            color='blue'
            content='Tyhjennä'
            icon='erase'
            onClick={(e) => handleResetOnClick(e)}
          />

          <Button
            content="Tallenna"
            icon='checkmark'
            onClick={(e) => handleSaveOnClick(e)}
            positive
            disabled={!isEntryReadyForSave()}
          />
        </Modal.Actions>

      </Modal>
    </>
  );
};

export default AddRefuelingModal;