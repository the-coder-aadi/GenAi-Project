import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import Home from "./Home";
import Pricing from "./Pricing";
function App() {
    return(
<BrowserRouter>
<Routes>
    <Route path="/" element={<Home />}/>
    <Route path="/plans" element={<Pricing />}/>
</Routes>
</BrowserRouter>
    )
}
export default App