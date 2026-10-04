# frontend/app.py
import streamlit as st
import requests
from io import BytesIO  # To display images

# Constants (adapt to your setup)
API_URL = "http://localhost:8000"  # Or the URL where your API is deployed

# --- Theme customization ---
st.set_page_config(
    page_title="Airton Glaucoma Analysis",
    page_icon="👁️",
    layout="wide", # Use wide
    initial_sidebar_state="expanded" #sidebar visible or not.
)

# Dark Theme Customization (More Extensive) - try this or see others at https://discuss.streamlit.io/t/dark-theme-and-customization-via-config-toml/7849
st.markdown(
    """
    <style>
    body {
        color: #d3d3d3; /* Light gray text */
        background-color: #282c34; /* Dark background */
    }
    .stApp {
        background-color: #282c34;
    }
    .stButton > button {
        color: white;
        background-color: #61afef; /* A color that pops on dark */
        border-radius: 5px;
    }
    .stTextInput > div > div > input, .stPasswordInput > div > div > input {
        color: #d3d3d3;
        background-color: #3e434e; /* Slightly lighter input fields */
        border: 1px solid #61afef;  /* Accent border */
    }
    .stFileUploader {
        color: #d3d3d3;
    }
    .stSelectbox > div > div > div > select {
        color: #d3d3d3;
        background-color: #3e434e;
        border: 1px solid #61afef;
    }
    .stSidebar {
       background-color: #282c34;
    }
    .stSidebar > div {
      color: #d3d3d3; /*sidebar color*/
    }

    </style>
    """,
    unsafe_allow_html=True,
)

# ---- Authentication Functions ----
def register(email, password):
    url = f"{API_URL}/register"
    data = {"email": email, "password": password}
    response = requests.post(url, json=data)
    return response

def login(email, password):
    url = f"{API_URL}/login"
    data = {"username": email, "password": password}
    response = requests.post(url, data=data)
    if response.status_code == 200:
        return response.json()  # Returns the token
    return None

# ---- Session State Initialization ----
if "access_token" not in st.session_state:
    st.session_state["access_token"] = None
if "user_data" not in st.session_state:
    st.session_state["user_data"] = None  # To store user information

# ---- Header and Navigation ----
st.markdown("<h1 style='text-align: center;'>Airton Glaucoma Analysis</h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align: center;'>Analyze your fundus images and detect glaucoma risk.</p>", unsafe_allow_html=True) #Short Description
st.sidebar.header("Navigation")

# ---- Registration/Login Forms ----
if not st.session_state["access_token"]:
    st.sidebar.subheader("Register")
    register_email = st.sidebar.text_input("Email", key="register_email")
    register_password = st.sidebar.text_input("Password", type="password", key="register_password")
    if st.sidebar.button("Register"):
        response = register(register_email, register_password)
        if response.status_code == 201:
            st.success("Registration successful! Please login.")
        else:
            st.error(f"Registration failed: {response.json().get('detail', 'Unknown error')}") #Improved error reporting
    st.sidebar.subheader("Login")
    login_email = st.sidebar.text_input("Email", key="login_email")
    login_password = st.sidebar.text_input("Password", type="password", key="login_password")
    if st.sidebar.button("Login"):
        auth_response = login(login_email, login_password)
        if auth_response:
            st.session_state["access_token"] = auth_response["access_token"]
            st.success("Logged in!")
            # Optionally:  Fetch and display user data on login (see dashboard section)
            try:
                user_response = requests.get(f"{API_URL}/user/me", headers={"Authorization": f"Bearer {st.session_state['access_token']}"}) # fetch the details
                user_response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
                st.session_state["user_data"] = user_response.json() #save user information

            except requests.exceptions.RequestException as e:
                st.error(f"Error fetching user data: {e}")  # Handle network errors, etc.
        else:
            st.error("Login failed. Check your credentials.")
else:  # User is logged in
    # ---- User Logout ----
    if st.sidebar.button("Logout"): #added logout
        st.session_state["access_token"] = None
        st.session_state["user_data"] = None
        st.success("Logged out")
        st.experimental_rerun()

    # ---- Image Analysis Section ----
    st.sidebar.subheader("Analyze Image")
    uploaded_file = st.file_uploader("Upload Fundus Image", type=["png", "jpg", "jpeg"])

    if uploaded_file is not None:
        # Display the uploaded image (optional)
        try:
            image_data = uploaded_file.read() # Read the bytes
            st.image(BytesIO(image_data), caption="Uploaded Image", use_column_width=True)
        except Exception as e:
            st.error(f"Error displaying image: {e}")
        if st.button("Analyze Image"):
            # Call the API to analyze the image
            try:
                headers = {"Authorization": f"Bearer {st.session_state['access_token']}"}
                files = {"file": (uploaded_file.name, uploaded_file, uploaded_file.type)} # Correct the 'file' tuple.
                response = requests.post(f"{API_URL}/analyze", files=files, headers=headers) # Added 'files' instead of 'data' and include 'headers'
                response.raise_for_status() # Raise HTTPError for bad responses
                analysis_result = response.json()
                st.success(f"Analysis Result: {analysis_result['prediction']}")
            except requests.exceptions.RequestException as e:  #Catch request exception (internet problems)
                st.error(f"API request failed: {e}")
            except Exception as e:  # Catch any other error that might occur during analysis (internal server problems).
                st.error(f"An unexpected error occurred: {e}") # For server or other issues that isn't network.

    # ---- Dashboard (Improved) ----
    st.sidebar.subheader("Dashboard")
    if st.session_state["user_data"]:
        st.sidebar.markdown(f"**Email:** {st.session_state['user_data']['email']}") # Fetch the Email

        # Fetch and Display Analysis History
        try:
            history_response = requests.get(f"{API_URL}/user/analysis_history", headers={"Authorization": f"Bearer {st.session_state['access_token']}"})
            history_response.raise_for_status()
            analysis_history = history_response.json()

            if analysis_history: # Show user data here using api/user/me
               st.sidebar.markdown("**Analysis History:**")
               for result in analysis_history: # for display of the uploaded images.
                    st.sidebar.markdown(f"- **File:** {result['filename']}, **Result:** {result['prediction']}, **Date:** {result['created_at']}") #show data with proper formate

            else:
                st.sidebar.markdown("No analysis history yet.")

        except requests.exceptions.RequestException as e:
            st.sidebar.error(f"Error fetching analysis history: {e}")
        except Exception as e:
             st.sidebar.error(f"An unexpected error occured while fetching analysis history: {e}")
    else:
       st.sidebar.markdown("Please login to view dashboard content.") #for showing after login