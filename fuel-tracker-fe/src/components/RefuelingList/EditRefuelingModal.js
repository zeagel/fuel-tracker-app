import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Modal, Grid, Segment, Input, Message } from 'semantic-ui-react';
import { resetRefuelingEntry } from '../../reducers/refuelingReducer';
import { updateUserRefuelingEntry, removeRefuelingFromUser } from '../../reducers/userReducer';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { clearNotification } from '../../reducers/notificationReducer';
import { addDays } from 'date-fns';

const EditRefuelingModal = () => {
  const refuelingToBeEdited = useSelector(state => state.refueling);
  const user = useSelector(state => state.user);
  const [openRefuelingEntryModal, setOpenRefuelingEntryModal] = useState(false);
  const [originalDate, setOriginalDate] = useState(undefined);
  const [date, setDate] = useState(undefined);
  const [originalOdoMeter, setOriginalOdoMeter] = useState();
  const [odoMeter, setOdoMeter] = useState('');
  const [faultyOdoMeter, setFaultyOdoMeter] = useState(false);
  const [originalLiters, setOriginalLiters] = useState();
  const [liters, setLiters] = useState('');
  const [faultyLiters, setFaultyLiters] = useState(false);
  const [trip, setTrip] = useState('');
  const [faultyTrip, setFaultyTrip] = useState(false);
  const [originalTrip, setOriginalTrip] = useState();
  const [avgConsumption, setAvgConsumption] = useState('');
  const [openDelRefuelingModal, setOpenDelRefuelingModal] = useState(false);
  const [inputErrorMessage, setInputErrorMessage] = useState('');
  const [odoFieldEnabled, setOdoFieldEnabled] = useState('');
  const [latestEntry, setLatestEntry] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    // Init edit modal attributes if refuelingToBeEdited is set.
    if (Object.keys(refuelingToBeEdited).length !== 0) {
      dispatch(clearNotification());
      setDate(new Date(refuelingToBeEdited.date));
      setOriginalDate(new Date(refuelingToBeEdited.date));
      setOdoMeter(refuelingToBeEdited.odoMeter);
      setOriginalOdoMeter(refuelingToBeEdited.odoMeter);
      setLiters(refuelingToBeEdited.liters);
      setOriginalLiters(refuelingToBeEdited.liters);
      setTrip(refuelingToBeEdited.tripKilometers);
      setOriginalTrip(refuelingToBeEdited.tripKilometers);
      setAvgConsumption(refuelingToBeEdited.avgConsumption);
      setOpenRefuelingEntryModal(true);

      // Identify which input field is enabled; odometer or trip?

      // First, get the vehicle having the refueling entry to be edited.
      const vehicle = user.vehicles.find(v => v.id === refuelingToBeEdited.vehicle.id);

      // Then, sort vehicle's refueling entry by date in descending order (latest first).
      vehicle.refuelings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // And finally check if the conditions of the rules are met.
      if (
        refuelingToBeEdited.id === vehicle.refuelings[0].id &&
        refuelingToBeEdited.odoMeter === vehicle.odoMeter
      ) {
        setOdoFieldEnabled(true);
        setLatestEntry(true);
      } else {
        setOdoFieldEnabled(false);
        setLatestEntry(false);
      }
    }

  },[dispatch, refuelingToBeEdited, user.vehicles]);

  const handleResetOnClick = () => {
    dispatch(clearNotification());
    setDate(new Date(refuelingToBeEdited.date));
    setOriginalDate(new Date(refuelingToBeEdited.date));
    setOdoMeter(refuelingToBeEdited.odoMeter);
    setOriginalOdoMeter(refuelingToBeEdited.odoMeter);
    setLiters(refuelingToBeEdited.liters);
    setOriginalLiters(refuelingToBeEdited.liters);
    setTrip(refuelingToBeEdited.tripKilometers);
    setOriginalTrip(refuelingToBeEdited.tripKilometers);
    setAvgConsumption(refuelingToBeEdited.avgConsumption);
    setOpenRefuelingEntryModal(true);
    setInputErrorMessage('');
    setFaultyLiters(false);
    setFaultyOdoMeter(false);
    setFaultyTrip(false);

    const vehicle = user.vehicles.find(v => v.id === refuelingToBeEdited.vehicle.id);
    vehicle.refuelings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (
      refuelingToBeEdited.id === vehicle.refuelings[0].id &&
      refuelingToBeEdited.odoMeter === vehicle.odoMeter
    ) {
      setOdoFieldEnabled(true);
      setLatestEntry(true);
    } else {
      setOdoFieldEnabled(false);
      setLatestEntry(false);
    }
  };

  const handleCancelOnClick = (e) => {
    // Below defined 'event.stopPropagation' is used so that the onClick
    // event is not bubble up on the parent component. See more information
    // about this behavior from the following StackOverFlow article:
    // https://tinyurl.com/y4k2dfuk
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      setOpenRefuelingEntryModal(false);
      dispatch(resetRefuelingEntry());
      setFaultyOdoMeter(false);
      setFaultyLiters(false);
      setFaultyTrip(false);
      setOdoFieldEnabled(true);
    }
  };

  const handleSaveOnClick = (e) => {
    e.stopPropagation();
    if (e.target === e.currentTarget) {

      dispatch(updateUserRefuelingEntry({
        refueling: {
          id: refuelingToBeEdited.id,
          date: date,
          odoMeter: !odoMeter ? '0' : odoMeter,
          liters: liters,
          trip: !trip ? '0' : trip
        }
      }));

      setOpenRefuelingEntryModal(false);
      dispatch(resetRefuelingEntry());
    }
  };

  const handleOdoMeterOnBlur = () => {
    setFaultyOdoMeter(false);
    setInputErrorMessage('');

    if (!odoMeter ) {
      setFaultyOdoMeter(true);
      setInputErrorMessage('Virhe! Kenttä ei saa olla tyhjä.');

    } else if (!Number.isInteger(Number(odoMeter))) {
      setFaultyOdoMeter(true);
      setInputErrorMessage('Virhe! Arvon tulee olla kokonaisluku.');

    } else if (Number(odoMeter) <= 0 ) {
      setFaultyOdoMeter(true);
      setInputErrorMessage('Virhe! Arvon tulee olla nollaa suurempi.');

    } else if (Number(odoMeter) === Number(originalOdoMeter)) {
      setFaultyOdoMeter(true);
      setInputErrorMessage('Virhe! Uusi arvo on sama kuin aiempi.');

    } else {
      const updatedTrip = Number(odoMeter) - (Number(refuelingToBeEdited.odoMeter) - Number(refuelingToBeEdited.tripKilometers));

      if (updatedTrip <= 0) {
        setTrip(updatedTrip);
        setFaultyOdoMeter(true);
        setInputErrorMessage('Virhe! Arvo on liian pieni.');

      } else if (updatedTrip > 2000) {
        setTrip(updatedTrip);
        setFaultyOdoMeter(true);
        setInputErrorMessage('Virhe! Arvo on liian suuri.');

      } else {
        const updatedAvgConsumption = (Number(liters) / Number(updatedTrip)) * 100;
        setTrip(updatedTrip);
        setAvgConsumption(updatedAvgConsumption);
      }
    }
  };

  const handleLitersOnBlur = () => {
    setFaultyLiters(false);
    setInputErrorMessage('');

    if (!liters) {
      setFaultyLiters(true);
      setInputErrorMessage('Virhe! Kenttä ei saa olla tyhjä.');

    } else if (isNaN(liters)) {
      setFaultyLiters(true);
      setInputErrorMessage('Virhe! Arvon tulee olla numero.');

    } else if (Number(liters) <= 0) {
      setFaultyLiters(true);
      setInputErrorMessage('Virhe! Arvon tulee olla nollaa suurempi.');

    } else if (Number(liters) === Number(originalLiters)) {
      setFaultyLiters(true);
      setInputErrorMessage('Virhe! Uusi arvo on sama kuin aiempi.');

    } else {
      const updatedAvgConsumption = (Number(liters) / Number(trip)) * 100;
      setAvgConsumption(updatedAvgConsumption);
    }
  };

  const handleTripOnBlur = () => {
    setFaultyTrip(false);
    setInputErrorMessage('');

    if (!trip) {
      setFaultyTrip(true);
      setInputErrorMessage('Virhe! Kenttä ei saa olla tyhjä.');

    } else if (isNaN(trip)) {
      setFaultyTrip(true);
      setInputErrorMessage('Virhe! Arvon tulee olla numero.');

    } else if (Number(trip) <= 0) {
      setFaultyTrip(true);
      setInputErrorMessage('Virhe! Arvon tulee olla nollaa suurempi.');

    } else if (Number(trip) === Number(originalTrip)) {
      setFaultyTrip(true);
      setInputErrorMessage('Virhe! Uusi arvo on sama kuin aiempi.');

    } else {
      const updatedAvgConsumption = (Number(liters) / Number(trip)) * 100;
      setAvgConsumption(updatedAvgConsumption);
    }
  };

  const handleDelCancelOnClick = (e) => {
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      setOpenDelRefuelingModal(false);
    }
  };

  const handleDelConfirmOnClick = (refuelingId) => {
    dispatch(removeRefuelingFromUser(refuelingId));
    dispatch(resetRefuelingEntry());
    setOpenDelRefuelingModal(false);
    setOpenRefuelingEntryModal(false);
  };

  const ErrorMessage = ({ showError }) => {
    if (!showError) {
      return null;
    }

    return (
      <Message error>
        <p>{inputErrorMessage}</p>
      </Message>
    );
  };

  // Return null if refueling entry to be edited
  // is not set on the Redux state.
  if (Object.keys(refuelingToBeEdited).length === 0) {
    return null;
  }

  const userHasEditRightsForEntry = () => {
    // Vehicle owner is allowed to edit all refueling entries,
    // also the ones created by co-owners -> the record is editable.
    if (refuelingToBeEdited.vehicle.owner === user.id) {
      return true;

    // Logged in user is not owner of the vehicle BUT he has
    // done the refueling entry -> the record is editable.
    } else if (refuelingToBeEdited.user.id === user.id) {
      return true;
    }

    // By default, the entry is not editable.
    return false;
  };

  const isSaveDisabled = () => {
    if (!userHasEditRightsForEntry()) {
      return true;
    }

    if (faultyOdoMeter || faultyLiters || faultyTrip ) {
      return true;
    }

    if ((date && originalDate) && (date.toString() === originalDate.toString() &&
        odoMeter === originalOdoMeter &&
        liters === originalLiters &&
        trip === originalTrip)
    ) {
      return true;
    }

    return false;
  };

  // When date of refueling entry is changed, we need to identify
  // is the odometer field enabled or not.
  const handleDateOnChange = (val) => {

    // Aux function for identifying is the edited entry the only one.
    const isOnlyEntry = () => {
      const vehicle = user.vehicles.find(v => v.id === refuelingToBeEdited.vehicle.id);
      if (vehicle.refuelings.length === 1) {
        return true;
      }

      return false;
    };

    const selectedDate = new Date(val).toISOString().split('T')[0];
    const dateInEntry = new Date(originalDate).toISOString().split('T')[0];

    if (isOnlyEntry()) {
      setOdoFieldEnabled(true);
    } else if (selectedDate === dateInEntry && latestEntry) {
      setOdoFieldEnabled(true);
      setDate(new Date(originalDate));
    } else {
      setOdoFieldEnabled(false);
    }

    setDate(new Date(val));
  };

  // Aux function for identifying is the RESET button enabled or disabled.
  // (Reset button should be active only if value in any input field has changed.)
  const isResetDisabled = () => {
    if (
      odoFieldEnabled &&
      new Date(date).getTime() === new Date(originalDate).getTime() &&
      odoMeter === originalOdoMeter &&
      liters === originalLiters
    ) {
      return true;
    } else if (
      !odoFieldEnabled &&
      new Date(date).getTime() === new Date(originalDate).getTime() &&
      liters === originalLiters &&
      trip === originalTrip
    ) {
      return true;
    }

    return false;
  };

  return (
    <>
      <Modal
        closeIcon={true}
        onClose={(e) => handleCancelOnClick(e)}
        onOpen={() => setOpenRefuelingEntryModal(true)}
        open={openRefuelingEntryModal}
        closeOnDimmerClick={false}
        closeOnEscape={false}
        size='tiny'
      >
        <Modal.Header>Muokkaa tankkausta</Modal.Header>
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
                    value={`${refuelingToBeEdited.vehicle.name} (${refuelingToBeEdited.vehicle.licensePlateId})`}
                    disabled={true}
                    fluid={true}
                  />
                </div>

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    Tankkaaja:
                  </div>
                  <Input
                    className='refueling-input'
                    name='user'
                    type='text'
                    value={refuelingToBeEdited.user.name}
                    disabled={true}
                    fluid={true}
                  />
                </div>

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    Päivämäärä:
                  </div>
                  <DatePicker
                    className={
                      !userHasEditRightsForEntry()
                        ? 'refueling-input dp-custom dp-disabled'
                        : 'refueling-input dp-custom editable'
                    }
                    value={date}
                    selected={date}
                    dateFormat='d.M.yyyy'
                    onChange={val => handleDateOnChange(val)}
                    // By preventing default action of onChangeRaw
                    // we disable keyboard input on DatePicker. The date
                    // value can be set only by selecting it.
                    onChangeRaw={(e) => e.preventDefault()}
                    disabled={!userHasEditRightsForEntry()}
                    maxDate={addDays(new Date(), 0)}
                  />
                </div>

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    Matkamittari:
                  </div>
                  <Input
                    className={
                      !(userHasEditRightsForEntry() && odoFieldEnabled)
                        ? 'refueling-input'
                        : 'refueling-input'.concat(faultyOdoMeter ? ' error' : ' editable')
                    }
                    name='odoMeter'
                    type='text'
                    value={odoMeter}
                    fluid={true}
                    onChange={(e) => setOdoMeter(e.target.value)}
                    onBlur={handleOdoMeterOnBlur}
                    disabled={!(userHasEditRightsForEntry() && odoFieldEnabled)}
                  />
                  <ErrorMessage showError={faultyOdoMeter} />
                </div>

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    Litrat:
                  </div>
                  <Input
                    className={
                      !userHasEditRightsForEntry()
                        ? 'refueling-input'
                        : 'refueling-input'.concat(faultyLiters ? ' error' : ' editable')
                    }
                    name='liters'
                    type='text'
                    value={liters}
                    fluid={true}
                    onChange={(e) => setLiters(e.target.value)}
                    onBlur={handleLitersOnBlur}
                    disabled={!userHasEditRightsForEntry()}
                  />
                  <ErrorMessage showError={faultyLiters} />
                </div>

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    Trippi:
                  </div>
                  <Input
                    className={
                      !(userHasEditRightsForEntry() && !odoFieldEnabled)
                        ? 'refueling-input'
                        : 'refueling-input'.concat(faultyTrip ? ' error' : ' editable')
                    }
                    name='trip'
                    type='text'
                    value={trip}
                    fluid={true}
                    onChange={(e) => setTrip(e.target.value)}
                    onBlur={handleTripOnBlur}
                    disabled={!(userHasEditRightsForEntry() && !odoFieldEnabled)}
                  />
                  <ErrorMessage showError={faultyTrip} />
                </div>

                <div className='refueling-input-block'>
                  <div className='row-label'>
                    KA. kulutus:
                  </div>
                  <Input
                    className='refueling-input'
                    name='avgConsumption'
                    type='text'
                    value={Number(avgConsumption).toFixed(2)}
                    disabled={true}
                    fluid={true}
                  />
                </div>

              </Segment>

              {
                userHasEditRightsForEntry()
                  ? null
                  :
                  <Message
                    warning
                    header='Muokkaus lukittu!'
                    content='Vain ajoneuvon omistaja tai tankkaaja itse voi muokata merkintää.'
                  />
              }

            </Grid.Column>
          </Grid>
        </Modal.Content>
        <Modal.Actions className='refueling-modal-actions'>

          <Button
            color='blue'
            content='Palauta'
            icon='erase'
            onClick={handleResetOnClick}
            disabled={isResetDisabled()}
          />

          <Button
            color='red'
            content='Poista'
            icon='delete'
            onClick={() => setOpenDelRefuelingModal(true)}
            disabled={!userHasEditRightsForEntry()}
          />

          <Button
            content="Tallenna"
            icon='checkmark'
            onClick={handleSaveOnClick}
            positive
            disabled={isSaveDisabled()}
          />
        </Modal.Actions>

        <Modal
          closeIcon={true}
          onClose={() => setOpenDelRefuelingModal(false)}
          onOpen={() => setOpenDelRefuelingModal(true)}
          open={openDelRefuelingModal}
          closeOnDimmerClick={false}
          closeOnEscape={false}
          size='tiny'
          className='del-refueling-modal'
        >
          <Modal.Content>
            <div className='del-refueling-modal-content'>
              Oletko varma, että haluat poistaa tämän tankkausmerkinnän?
            </div>
          </Modal.Content>
          <Modal.Actions>
            <Button
              color='black'
              content='Peruuta'
              onClick={handleDelCancelOnClick}
            />

            <Button
              color='red'
              content='Poista'
              onClick={() => handleDelConfirmOnClick(refuelingToBeEdited.id)}
            />
          </Modal.Actions>

        </Modal>

      </Modal>
    </>
  );
};

export default EditRefuelingModal;