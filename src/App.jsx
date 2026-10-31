import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Props Example
function About(props) {
  return (
    <div>
      <h1>About Page</h1>
      <p>Welcome {props.name}</p>
    </div>
  );
}

function Contact() {
  return (
    <div>
      <h1>Contact Page</h1>
      <p>Phone: 6949461</p>
    </div>
  );
}

// Counter Component
function Home() {
  const [count, setCount] = useState(0);

  // useEffect Example
  useEffect(() => {
    console.log("Count changed: " + count);
  }, [count]);

  return (
    <div>
      <h1>Counter</h1>
      <h2>{count}</h2>

      <button onClick={() => setCount(count + 1)}>
        Increase
      </button>
    </div>
  );
}

// Main App
function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link> |{" "}
        <Link to="/about">About</Link> |{" "}
        <Link to="/contact">Contact</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Props: name is passed to About component */}
        <Route path="/about" element={<About name="Anuj" />} />
        
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;