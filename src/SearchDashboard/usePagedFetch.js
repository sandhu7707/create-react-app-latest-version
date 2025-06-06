import { useEffect, useReducer, useRef } from "react";

const initialState = {
    students: [],
    hasMore: true,
    limit: null
}

function reducers(state, action) {

    switch (action.type) {
        case 'fetch-success': {
            let data = action.data.results;
            let hasMore = action.data.hasMore;
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
                    students: s.concat(filteredResults).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
                    hasMore: hasMore
                }
            }
            else {
                console.log("no new results fetched")
                return {
                    ...state,
                    hasMore: hasMore
                }
            }
        }
        case 'reset-hasMore': {
            return {
                ...state,
                hasMore: true
            }
        }
        case 'set-limit': {
            console.log('setting limit to: ', action.data.limit)
            return{
                ...state,
                limit: action.data.limit
            }
        }
        default: {
            console.error('reducer action not defined!')
            return state;
        }
    }
}


export default function useIncrementalFetch(searchStrVal, url, debounceDelay, initialLimit) {
    console.log("render: useIncrementalFetch")
    const [state, dispatch] = useReducer(reducers, {...initialState, limit: initialLimit})

    let limit = state.limit;
    let students = state.students;
    let hasMore = state.hasMore;

    let results = []
    if (searchStrVal.length >= 3) {
        for (let i0 = 0; i0 < students.length && results.length < limit; i0++) {
            if (students[i0].name.toLowerCase().startsWith(searchStrVal)) {
                results.push(students[i0])
            }
        }

        for (let i0 = 0; i0 < students.length && results.length < limit; i0++) {
            if (students[i0].name.toLowerCase().includes(searchStrVal) && !results.find(it => it.name === students[i0].name)) {
                results.push(students[i0])
            }
        }
    }

    const debounce = useRef({ clear: null, time: null });
    useEffect(() => {
        let clear;
        if (searchStrVal.length >= 3) {
            dispatch({ type: 'reset-hasMore' })
        }
        if (searchStrVal.length >= 3 && results.length < limit) {
            const fetchNames = (nameStr) => {
                fetch(url(nameStr, limit, results.length))
                    .then((data) => data.json())
                    .then((data) => {
                        dispatch({ type: 'fetch-success', data: data })
                    })

            }
            let de = debounce.current;
            let delay = debounceDelay;
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
    }, [searchStrVal, limit, url, debounceDelay])

    const setLimit = (arg) => dispatch({
        type: 'set-limit',
        data: {
            limit: typeof arg === 'function' ? arg(limit) : arg
        }
    })
    
    return { results: results, hasMore: hasMore , setLimit: setLimit}
}
