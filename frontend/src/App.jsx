import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import { useEffect, useState } from "react";
import MedhaSplashLoader from "./components/MedhaSplashLoader";
import Home from "./Home";
import Pricing from "./Pricing";
function App() {
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    useEffect(() => {
  const timer = setTimeout(() => {
    setIsInitialLoading(false);
  }, 3000);

  return () => clearTimeout(timer);
}, []);
    return(
        <>

 <MedhaSplashLoader
      isLoading={isInitialLoading}
      duration={3000}
    />        

<BrowserRouter>
<Routes>
    <Route path="/" element={<Home />}/>
    <Route path="/plans" element={<Pricing />}/>
</Routes>
</BrowserRouter>
</>
    )
}
export default App