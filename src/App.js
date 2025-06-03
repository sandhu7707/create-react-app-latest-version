import './App.css';
import { useEffect, useReducer, useRef } from 'react';

const LIMIT = 5;
const DEBOUNCE_DELAY = 500;

const initialState = {
  searchStrVal: '',
  students: [],
  selectedStudent: null,
}

function reducers(state, action) {

  switch (action.type) {
    case 'fetch-success': {
      let data = action.data;
      let s = state.students;
      let filteredResults = [];
      for (let item of data) {
        let eligible = true;
        for (let student of s) {
          if (item.rollNumber === student.rollNumber) {
            eligible = false;
            break;
          }
        }
        if (eligible) {
          filteredResults.push(item)
        }
      }

      if (filteredResults.length > 0) {
        console.log(filteredResults.length, " new students loaded from fetched results")
        return {
          ...state,
          students: s.concat(filteredResults).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
        }
      }
      else {
        console.log("no new results fetched")
        return state
      }
    }
    case 'select-result': {
      let filteredStudents = state.students.filter(it => it.rollNumber === parseInt(action.rollNumber))
      return {
        ...state,
        selectedStudent: filteredStudents[0]
      }
    }
    case 'search-str-input': {
      let data = action.data;
      return {
        ...state,
        searchStrVal: data
      }
    }
    default: {
      console.error('reducer action not defined!')
      return state;
    }
  }
}

function App() {
  console.log('render')
  const [state, dispatch] = useReducer(reducers, initialState)
  let searchStrVal = state.searchStrVal;
  const selectedStudent = state.selectedStudent;
  const students = state.students;

  searchStrVal = searchStrVal.toLowerCase()
  let results = []
  if(searchStrVal.length >= 3){
    for (let i0 = 0; i0 < students.length && results.length < LIMIT; i0++) {
      if (students[i0].name.toLowerCase().startsWith(searchStrVal)) {
        results.push(students[i0])
      }
    }

    for (let i0 = 0; i0 < students.length && results.length < LIMIT; i0++) {
      if (students[i0].name.toLowerCase().includes(searchStrVal) && !results.find(it => it.name === students[i0].name)) {
        results.push(students[i0])
      }
    }
  }

  const debounce = useRef({ clear: null, time: null });
  useEffect(() => {
    let clear;
    if (searchStrVal.length >= 3 && results.length < LIMIT) {
      const fetchNames = (nameStr) => {
        fetch(`http://localhost:8080/search/name/${nameStr}/${LIMIT}`)
        .then((data) => data.json())
        .then((data) => {
          dispatch({ type: 'fetch-success', data: data })
        })
      
      }
      let de = debounce.current;
      let delay = DEBOUNCE_DELAY;
      if (de.time) {
        let elapsed = document.timeline.currentTime - de.time
        if (elapsed < de.delay) {
          clearTimeout(de.clear);
          delay = de.delay - elapsed;
        }
      }
      let nameStr = searchStrVal.toLowerCase()
      clear = setTimeout(() => fetchNames(nameStr), delay);
      debounce.current = { clear: clear, time: document.timeline.currentTime, delay: delay }
    }
    
    return () => clearTimeout(clear)
  }, [searchStrVal])

  function handleSelect(rollNumber) {
    dispatch({ type: 'select-result', rollNumber: rollNumber })
  }

  const searchRef = useRef(null);
  window.onclick = (e) => {
    if (searchStrVal.length > 0 && e.target !== searchRef.current) {
      dispatch({ type: 'search-str-input', data: '' })
    }
  }

  return (
    <div className="App">
      <div className='search-container'>
        <input ref={searchRef} className="searchbar" type='search' style={{ width: '100%' }} value={searchStrVal} onChange={(e) => dispatch({ type: 'search-str-input', data: e.target.value })} />
        <SearchResults results={results} handleSelect={handleSelect} searchStrVal={searchStrVal} />
      </div>
      <div className='selected-result'>
        {selectedStudent &&
          <section>
            <p className='selected-result-row'>Roll Number: {selectedStudent.rollNumber}</p>
            <p className='selected-result-row'>Name: {selectedStudent.name}</p>
            <p className='selected-result-row'>Class: {selectedStudent.class}</p>
          </section>
        }
      </div>
    </div>
  );
}

function SearchResults({ results, handleSelect, searchStrVal }) {

  const getResultString = (result) => {
    if (!result) {
      return
    }
    let name = result.name;
    let regex = new RegExp(searchStrVal, 'i')
    let match = regex.exec(name)
    if (!match) {
      return <>{name}, Roll Number: {result.rollNumber}</>
    }
    let nameBefore = name.slice(0, match.index)
    let nameAfter = name.slice(match.index + match[0].length, name.length)
    return <>{nameBefore}<b>{match[0]}</b>{nameAfter}, Roll Number: {result.rollNumber}</>;
  }

  return (
    <div className="search-results-container">
      <div className='search-results'>
        {results.map((result) =>
          <div className="search-result" key={result.rollNumber} onClick={() => handleSelect(result.rollNumber)}>{getResultString(result)}</div>
        )}
      </div>
    </div>
  )
}

export default App;
