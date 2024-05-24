'use client';
import {createContext, useContext, useState} from "react";
import {useSession} from "next-auth/react";
import {useInterval} from "ahooks";
import googleOneTap from 'google-one-tap';


const CommonContext = createContext(undefined);
export const CommonProvider = ({
                                 children,
                                 commonText,
                                 authText,
                                 menuText
                               }) => {

  const {data: session, status} = useSession();
  const [userData, setUserData] = useState();
  const [intervalUserData, setIntervalUserData] = useState(1000);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [toastText, setToastText] = useState('');
  const [showToastModal, setShowToastModal] = useState(false);

  useInterval(() => {
    if (process.env.NEXT_PUBLIC_CHECK_GOOGLE_LOGIN != '0') {
      init();
    }
  }, intervalUserData);

  async function init() {
    const user_id = sessionStorage.getItem("user_id");
    if (user_id) {
      await getUserById(user_id);
    } else {
      if (status == 'authenticated') {
        await getUserByEmail(session.user.email);
        setShowLoginModal(false);
      } else if (status == 'unauthenticated') {
        setIntervalUserData(undefined);
        // https://www.npmjs.com/package/google-one-tap
        const options = {
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, // required
          auto_select: false, // optional
          cancel_on_tap_outside: false, // optional
          context: 'signin', // optional
        };
        googleOneTap(options, (response) => {
          const token = response.credential;
          getUserOneTap(token);
        });
      }
    }
  }

  const getUserOneTap = async (token) => {
    const requestData = {
      token: token
    }
    const responseData = await fetch(`/api/user/oneTap`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    const result = await responseData.json();
    if (result.user_id) {
      sessionStorage.setItem("user_id", result.user_id);
      sessionStorage.setItem("image", result.image);
      sessionStorage.setItem("email", result.email);
      setUserData(result);
      setShowLoginModal(false);
    }
    setIntervalUserData(undefined);
  }

  const getUserByEmail = async (email) => {
    const requestData = {
      email: email
    }
    const response = await fetch(`/api/user/getUserByEmail`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    if (response.status != 200) {
      return;
    }
    const result = await response.json();
    if (result.email) {
      sessionStorage.setItem("user_id", result.user_id);
      sessionStorage.setItem("image", result.image);
      sessionStorage.setItem("email", result.email);
      setUserData(result);
    }
    setIntervalUserData(undefined);
  }

  const getUserById = async (user_id) => {
    // 先查询本地有没有，有的话就取本地，同时去获取数据库的
    const image = sessionStorage.getItem("image");
    const email = sessionStorage.getItem("email");
    if (image) {
      const userData = {
        user_id: user_id,
        image: image,
        email: email
      }
      // @ts-ignore
      setUserData(userData)
    }
    const requestData = {
      user_id: user_id,
    }
    const response = await fetch(`/api/user/getUserByUserId`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    if (response.status != 200) {
      return;
    }
    const result = await response.json();
    if (result.email) {
      sessionStorage.setItem("image", result.image);
      sessionStorage.setItem("email", result.email);
      setUserData(result);
    }
    setIntervalUserData(undefined);
  }


  return (
    <CommonContext.Provider
      value={{
        userData, setUserData,
        showLoginModal, setShowLoginModal,
        showLogoutModal, setShowLogoutModal,
        showLoadingModal, setShowLoadingModal,
        showPricingModal, setShowPricingModal,
        toastText, setToastText,
        showToastModal, setShowToastModal,
        commonText, authText,
        menuText,
      }}
    >
      {children}
    </CommonContext.Provider>
  );

}

export const useCommonContext = () => useContext(CommonContext)
