import { IconButton } from "@mui/material";
import { Search, Person, Menu } from "@mui/icons-material";
import variables from "../styles/variables.scss";
import { useState , useRef} from "react";
import { useSelector, useDispatch } from "react-redux";
import "../styles/Navbar.scss";
import { Link, useNavigate } from "react-router-dom";
import { setLogout } from "../redux/state";
import {debounce} from 'lodash'



const Navbar = () => {
  const [dropdownMenu, setDropdownMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
const [showDropdown, setShowDropdown] = useState(false);


  const user = useSelector((state) => state.user);

  const dispatch = useDispatch();

  const [search, setSearch] = useState("")

  const navigate = useNavigate()

  const handleSearch = () => {
    if (search.trim() !== "") {
      navigate(`/properties/search/${search}`);
    }
  };

  const debouncedSearch = useRef(
    debounce(async (query) => {
      if (query.trim()) {
        try {
          const response = await fetch(`http://localhost:3001/properties/search-suggestions?q=${query}`);
          if (!response.ok) {
            throw new Error("Failed to fetch suggestions");
          }
  
          const data = await response.json();
          setSuggestions(data); // Expecting an array of suggestions
          setShowDropdown(true);
          console.log(data)
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
          setShowDropdown(false);
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300)
  ).current;
  
  
  

  // Handle the "Enter" key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && search.trim() !== "") {
      handleSearch();
    }
  };

  return (
    <div className="navbar">
      <a href="/">
        <img src="/assets/logo.png" alt="logo" />
      </a>

      <div className="navbar_search">
  <input
    type="text"
    placeholder="Type & press Enter"
    value={search}
    onChange={(e) => {
      const value = e.target.value;
      setSearch(value);
      debouncedSearch(value);
    }}
    onKeyDown={handleKeyPress}
  />
  <IconButton disabled={search === ""} onClick={handleSearch}>
    <Search sx={{ color: variables.pinkred }} />
  </IconButton>

  {showDropdown && suggestions.length > 0 && (
    <div className="search-dropdown">
      {suggestions.map((item, index) => (
        <div
          key={index}
          className="search-dropdown-item"
          onClick={() => {
            setSearch(item);
            setShowDropdown(false);
            navigate(`/properties/search/${item}`);
          }}
        >
          {item}
        </div>
      ))}
    </div>
  )}
</div>


      <div className="navbar_right">
        {user ? (
          <a href="/create-listing" className="host">
            Become A Host
          </a>
        ) : (
          <a href="/login" className="host">
            Become A Host
          </a>
        )}

        <button
          className="navbar_right_account"
          onClick={() => setDropdownMenu(!dropdownMenu)}
        >
          <Menu sx={{ color: variables.darkgrey }} />
          {!user ? (
            <Person sx={{ color: variables.darkgrey }} />
          ) : (
            <img
              src={`http://localhost:3001${user.profileImagePath}`} 
              alt="profile photo"
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />


          )}
        </button>

        {dropdownMenu && !user && (
          <div className="navbar_right_accountmenu">
            <Link to="/login">Log In</Link>
            <Link to="/register">Sign Up</Link>
          </div>
        )}

        {dropdownMenu && user && (
          <div className="navbar_right_accountmenu">
            <Link to={`/${user._id}/trips`}>Trip List</Link>
            <Link to={`/${user._id}/wishList`}>Wish List</Link>
            <Link to={`/${user._id}/properties`}>Property List</Link>
            {/* <Link to={`/${user._id}/reservations`}>Reservation List</Link> */}
            <Link to="/create-listing">Become A Host</Link>

            <Link
              to="/login"
              onClick={() => {
                dispatch(setLogout());
              }}
            >
              Log Out
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
