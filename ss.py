##
import requests

#example of how the request works without UI

def customer():
    url="https://pizzapos-837174473504.us-south1.run.app/api/v1/Customer"
    response = requests.get(url)
    #just prints out all customers
    print(response.text)
    # print(response.text)

    #
    #
    #get user name
    user=input("Enter phonenumber")
    #user password
    word=input("Enter password")
    login={}
    login["phonenumber"]=user
    login["password"]=word
    loginurl="https://pizzapos-837174473504.us-south1.run.app/api/v1/Customer/login"

    #send request to backend
    #send a json object specified in your class to verify login
    # login={
    #     "phonenumber":"678",
    #     "password": "sigma"
    # }
    r2= requests.post(loginurl,json=login)
    #request returns status code
    print(r2.status_code)
    #200 means success
    #any other code means no sucess
    if r2.status_code == 200:
        print("Success")
    else:
        print("No!")




customer()