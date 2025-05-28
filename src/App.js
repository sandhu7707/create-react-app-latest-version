import './App.css';
import { useEffect, useRef, useState } from 'react';

function App() {
  const limit = 5;
  const debounceDelay = 500;
  var [triggerSwitch, setTriggerSwitch] = useState(false)
  var [searchStrVal, setSearchStrVal] = useState('')
  var [students, setStudents] = useState([])
  var [results, setResults] = useState([])
  var [selectedStudent, setSelectedStudent] = useState()
  var [debounce, setDebounce] = useState({clear: null, time: null});

  var searchRef = useRef(null);

  function searchStr (nameStr) {
      nameStr = nameStr.toLowerCase()
      let results = []
      for(let i0=0; i0<students.length && results.length <= limit; i0++){
          if(students[i0].name.toLowerCase().startsWith(nameStr)) {
              results.push(students[i0])
          }
      }
        
      let newLimit = limit - results.length;
      if(newLimit > 0){
        let delay = debounceDelay;
        if(debounce.time){
          let elapsed =  document.timeline.currentTime - debounce.time
          console.log(elapsed)
          if(elapsed < debounce.delay){
            clearTimeout(debounce.clear);
            delay = debounce.delay - elapsed;
          }
        }
        let clear = setTimeout(() => fetchNames(newLimit), delay);
        setDebounce({clear: clear, time: document.timeline.currentTime, delay: delay})
      }
      for(let i0=0; i0<students.length && results.length<= limit; i0++){
          if(students[i0].name.toLowerCase().includes(nameStr) && !results.find(it => it.name === students[i0].name)){
              results.push(students[i0])
          }
      }

      return results;
  }

  function fetchNames(newLimit){
    let nameStr = searchStrVal.toLowerCase();
    console.log(`fetching for ${nameStr} with limit ${newLimit}`)
    fetch(`https://express-js-on-vercel-tests-git-main-sandhu7707s-projects.vercel.app/search/name/${nameStr}/${newLimit}`)
    .then((data) => data.json())
    .then((data) => {
      let filteredResults = [];
      for(let item of data){
        let eligible = true;
        for(let student of students){
          if(item.rollNumber === student.rollNumber){
            eligible = false;
            break;
          }
        }
        if(eligible){
          filteredResults.push(item)
        }
      }

      setStudents((s) => s.concat(filteredResults));
      if(filteredResults.length > 0){
        console.log("new students loaded")
        setTriggerSwitch(s => setTriggerSwitch(!s))
      }
      else{
        console.log("no new results")
      }
    })
  }

  useEffect(() => {

    if(searchStrVal.length >= 3){
      let newResults = searchStr(searchStrVal)
      setResults(newResults)
    }
    else{
      setResults([])
    }

  }, [searchStrVal, triggerSwitch])

  useEffect(()=> {
    console.log("results updated, new results: ", results)
  }, [results])

  function handleSelect(rollNumber){
    console.log(rollNumber)
    let selectedStudent = students.find(it => it.rollNumber === parseInt(rollNumber))
    setSelectedStudent(selectedStudent)
    console.log("selected student, ", selectedStudent)
  }

  const getResultString = (result) => {
    if(!result){
      return
    }
    let name = result.name;
    let regex = new RegExp(searchStrVal, 'gi')
    let match = regex.exec(name)
    if(!match){
      return <>{name}, Roll Number: {result.rollNumber}</>
    }
  
    let nameBefore = name.slice(0, match.index)
    let nameAfter = name.slice(match.index+match[0].length, name.length)
    return <>{nameBefore}<b>{match[0]}</b>{nameAfter}, Roll Number: {result.rollNumber}</>;
  }

  window.onclick = (e) => {
    if(e.target !== searchRef.current){
      setSearchStrVal('')
    }
  }

  return (
    <div className="App">
      <div className='search-container'>
        <input ref={searchRef} className="searchbar" type='search' style={{width: '100%'}} value={searchStrVal} onChange={(e)=> setSearchStrVal(e.target.value)}/>
        <div className="search-results-container">
          <div className='search-results'>
            {results.map((result) => 
              <div className="search-result" key={result.rollNumber} onClick={() => handleSelect(result.rollNumber)}>{getResultString(result)}</div>
            )}
          </div>
        </div>
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

export default App;
