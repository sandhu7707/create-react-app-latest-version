import { useCallback, useRef, useState } from 'react';
import useIncrementalFetch from './usePagedFetch';

const LIMIT = 5;
const DEBOUNCE_DELAY = 500;
const URL = (searchStr, limit, offset) => `https://express-js-on-vercel-tests-git-main-sandhu7707s-projects.vercel.app/search/name/${searchStr}?limit=${limit}&offset=${offset}`;

export default function SearchDashboard() {

    console.log('render: SearchDashboard')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [searchStrVal, setSearchStrVal] = useState('')
    const { results, hasMore, setLimit } = useIncrementalFetch(searchStrVal.toLowerCase(), URL, DEBOUNCE_DELAY, LIMIT);

    function handleSelect(rollNumber) {
        setSelectedStudent(results.filter(it => it.rollNumber === parseInt(rollNumber))[0])
    }

    const checkIfSelfOrChild = useCallback((container, element) => {

        if (container === element) {
            return true;
        }

        let i0 = 0;
        while (container.children.length > i0) {
            if (checkIfSelfOrChild(container.children.item(i0++), element)) {
                return true;
            }
        }

        return false;
    }, [])

    const searchRef = useRef(null);
    window.onclick = (e) => {
        if (searchStrVal.length > 0) {
            if (checkIfSelfOrChild(searchRef.current, e.target)) {
                return;
            }
            setSearchStrVal('')
            setLimit(LIMIT)
        }
    }

    const handleInput = (e) => {
        setSearchStrVal(e.target.value)
        setLimit(LIMIT)
    }

    return (
        <>
            <div ref={searchRef} className='search-container'>
                <input className="searchbar" type='search' style={{ width: '100%' }} value={searchStrVal} onChange={handleInput} />
                {results.length > 0 && <SearchResults results={results} handleSelect={handleSelect} searchStrVal={searchStrVal} setLimit={setLimit} hasMore={hasMore} />}
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
        </>
    )
}


function SearchResults({ results, handleSelect, searchStrVal, setLimit, hasMore }) {

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
                {hasMore && <div className='search-result load-more-button' onClick={() => setLimit(limit => limit + LIMIT)}>Load More...</div>}
            </div>
        </div>
    )
}