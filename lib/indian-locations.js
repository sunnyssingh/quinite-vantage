// Indian States and Cities Data - Comprehensive Edition
export const INDIAN_STATES = [
    { code: '01', name: 'Jammu and Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
    { code: '27', name: 'Maharashtra' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '31', name: 'Lakshadweep' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' },
    { code: '35', name: 'Andaman and Nicobar Islands' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh' }
]

// Comprehensive cities by state (20-30+ major cities per state)
export const CITIES_BY_STATE = {
    'Delhi': [
        'New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi',
        'West Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi',
        'South West Delhi', 'Shahdara', 'Dwarka'
    ],
    'Maharashtra': [
        'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur',
        'Kolhapur', 'Amravati', 'Navi Mumbai', 'Sangli', 'Malegaon', 'Jalgaon',
        'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani',
        'Ichalkaranji', 'Jalna', 'Ambarnath', 'Bhiwandi', 'Panvel', 'Mira-Bhayandar',
        'Kalyan-Dombivli', 'Vasai-Virar', 'Nanded', 'Satara', 'Wardha'
    ],
    'Karnataka': [
        'Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum', 'Gulbarga',
        'Shimoga', 'Tumkur', 'Bellary', 'Bijapur', 'Raichur', 'Davangere',
        'Hospet', 'Hassan', 'Gadag', 'Udupi', 'Chitradurga', 'Mandya',
        'Chikmagalur', 'Bidar', 'Kolar', 'Dharwad', 'Bagalkot', 'Karwar'
    ],
    'Tamil Nadu': [
        'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
        'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Tiruppur',
        'Nagercoil', 'Kanchipuram', 'Kumbakonam', 'Karur', 'Cuddalore', 'Neyveli',
        'Ambur', 'Pollachi', 'Rajapalayam', 'Pudukkottai', 'Hosur', 'Tambaram',
        'Avadi', 'Tiruvannamalai', 'Sivakasi', 'Pallavaram', 'Vellore', 'Ooty'
    ],
    'Telangana': [
        'Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam',
        'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Siddipet', 'Miryalaguda',
        'Jagtial', 'Mancherial', 'Nirmal', 'Kamareddy', 'Kothagudem', 'Bodhan',
        'Sangareddy', 'Metpally', 'Zahirabad', 'MedChal', 'Gadwal', 'Wanaparthy'
    ],
    'Gujarat': [
        'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar',
        'Gandhinagar', 'Junagadh', 'Anand', 'Nadiad', 'Morbi', 'Surendranagar',
        'Bharuch', 'Mehsana', 'Bhuj', 'Porbandar', 'Palanpur', 'Valsad',
        'Vapi', 'Navsari', 'Veraval', 'Godhra', 'Patan', 'Kalol', 'Dahod',
        'Botad', 'Amreli', 'Deesa', 'Jetpur'
    ],
    'Rajasthan': [
        'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar',
        'Bharatpur', 'Bhilwara', 'Sikar', 'Pali', 'Sri Ganganagar', 'Tonk',
        'Beawar', 'Hanumangarh', 'Kishangarh', 'Bundi', 'Jhunjhunu', 'Churu',
        'Barmer', 'Sawai Madhopur', 'Nagaur', 'Makrana', 'Sujangarh', 'Sardarshahar'
    ],
    'Uttar Pradesh': [
        'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad',
        'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur',
        'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Rampur', 'Shahjahanpur',
        'Farrukhabad', 'Ayodhya', 'Maunath Bhanjan', 'Hapur', 'Etawah', 'Mirzapur',
        'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli',
        'Orai', 'Sitapur', 'Bahraich', 'Modinagar', 'Unnao', 'Jaunpur', 'Lakhimpur',
        'Hathras', 'Banda', 'Pilibhit', 'Barabanki', 'Khurja', 'Gonda', 'Mainpuri'
    ],
    'West Bengal': [
        'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman',
        'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni',
        'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip',
        'Medinipur', 'Jalpaiguri', 'Balurghat', 'Basirhat', 'Bankura', 'Chakdaha',
        'Darjeeling', 'Alipurduar', 'Purulia', 'Jangipur'
    ],
    'Madhya Pradesh': [
        'Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Ratlam',
        'Dewas', 'Satna', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa',
        'Morena', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Chhatarpur',
        'Damoh', 'Mandsaur', 'Khargone', 'Neemuch', 'Pithampur', 'Hoshangabad',
        'Itarsi', 'Sehore', 'Betul', 'Seoni', 'Datia', 'Nagda'
    ],
    'Punjab': [
        'Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda',
        'Mohali', 'Hoshiarpur', 'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla',
        'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Firozpur', 'Kapurthala',
        'Faridkot', 'Sunam', 'Sangrur', 'Nabha', 'Mansa', 'Gurdaspur', 'Kharar'
    ],
    'Haryana': [
        'Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar',
        'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind',
        'Thanesar', 'Kaithal', 'Rewari', 'Palwal', 'Hansi', 'Narnaul', 'Fatehabad',
        'Gohana', 'Tohana', 'Narwana', 'Mandi Dabwali', 'Charkhi Dadri', 'Shahabad',
        'Pehowa', 'Samalkha', 'Pinjore'
    ],
    'Bihar': [
        'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif',
        'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Danapur', 'Saharsa',
        'Sasaram', 'Hajipur', 'Dehri', 'Siwan', 'Motihari', 'Nawada', 'Bagaha',
        'Buxar', 'Kishanganj', 'Sitamarhi', 'Jamalpur', 'Jehanabad', 'Aurangabad',
        'Lakhisarai', 'Sheikhpura', 'Madhepura', 'Samastipur', 'Bettiah', 'Khagaria'
    ],
    'Andhra Pradesh': [
        'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati',
        'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur', 'Vizianagaram', 'Eluru',
        'Ongole', 'Nandyal', 'Machilipatnam', 'Adoni', 'Tenali', 'Proddatur',
        'Chittoor', 'Hindupur', 'Bhimavaram', 'Madanapalle', 'Guntakal', 'Dharmavaram',
        'Gudivada', 'Narasaraopet', 'Tadpatri', 'Tadipatri', 'Chilakaluripet'
    ],
    'Kerala': [
        'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad',
        'Alappuzha', 'Malappuram', 'Kannur', 'Kottayam', 'Kasaragod', 'Pathanamthitta',
        'Idukki', 'Wayanad', 'Ernakulam', 'Thalassery', 'Ponnani', 'Vatakara',
        'Kanhangad', 'Payyanur', 'Koyilandy', 'Parappanangadi', 'Kalamassery',
        'Neyyattinkara', 'Kayamkulam', 'Nedumangad', 'Kannur', 'Changanassery',
        'Kattappana', 'Thodupuzha', 'Chalakudy', 'Cherthala', 'Guruvayur', 'Pala'
    ],
    'Odisha': [
        'Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri',
        'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Bargarh',
        'Balangir', 'Rayagada', 'Bhawanipatna', 'Dhenkanal', 'Barbil', 'Kendujhar',
        'Sunabeda', 'Jatani', 'Paradip', 'Angul', 'Talcher', 'Phulbani', 'Koraput'
    ],
    'Jharkhand': [
        'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh',
        'Giridih', 'Ramgarh', 'Medininagar', 'Chirkunda', 'Phusro', 'Adityapur',
        'Gumia', 'Dumka', 'Sahibganj', 'Chaibasa', 'Jhumri Tilaiya', 'Saunda',
        'Godda', 'Chatra', 'Garhwa', 'Lohardaga', 'Pakur', 'Koderma', 'Latehar'
    ],
    'Assam': [
        'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia',
        'Tezpur', 'Bongaigaon', 'Dhubri', 'Diphu', 'North Lakhimpur', 'Karimganj',
        'Sivasagar', 'Goalpara', 'Barpeta', 'Lanka', 'Lumding', 'Mangaldoi',
        'Nalbari', 'Rangia', 'Mariani', 'Digboi', 'Haflong', 'Kokrajhar', 'Hailakandi'
    ],
    'Chhattisgarh': [
        'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon',
        'Jagdalpur', 'Raigarh', 'Ambikapur', 'Mahasamund', 'Dhamtari', 'Chirmiri',
        'Bhatapara', 'Dalli-Rajhara', 'Naila Janjgir', 'Tilda Newra', 'Mungeli',
        'Manendragarh', 'Sakti', 'Kawardha', 'Dongargarh', 'Bemetara'
    ],
    'Uttarakhand': [
        'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur',
        'Rishikesh', 'Pithoragarh', 'Ramnagar', 'Jaspur', 'Almora', 'Nainital',
        'Tehri', 'Pauri', 'Srinagar', 'Kotdwar', 'Manglaur', 'Laksar', 'Sitarganj',
        'Kichha', 'Sultanpur', 'Bazpur', 'Khatima', 'Tanakpur', 'Vikasnagar'
    ],
    'Himachal Pradesh': [
        'Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Baddi',
        'Nahan', 'Palampur', 'Sundernagar', 'Chamba', 'Una', 'Hamirpur',
        'Bilaspur', 'Yol', 'Nalagarh', 'Nurpur', 'Kangra', 'Santokhgarh',
        'Mehatpur', 'Shamshi', 'Parwanoo', 'Manali', 'Dalhousie', 'Kasauli'
    ],
    'Jammu and Kashmir': [
        'Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua',
        'Sopore', 'Rajauri', 'Punch', 'Kupwara', 'Bandipore', 'Ganderbal',
        'Pulwama', 'Kulgam', 'Shopian', 'Budgam', 'Samba', 'Reasi', 'Ramban',
        'Kishtwar', 'Doda', 'Poonch', 'Rajouri', 'Akhnoor', 'Vijaypur'
    ],
    'Goa': [
        'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim',
        'Curchorem', 'Sanquelim', 'Cuncolim', 'Quepem', 'Canacona', 'Pernem',
        'Valpoi', 'Sanguem', 'Mormugao'
    ],
    'Puducherry': [
        'Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Ozhukarai', 'Villianur',
        'Ariankuppam', 'Nettapakkam', 'Kurumbapet'
    ],
    'Chandigarh': ['Chandigarh'],
    'Tripura': [
        'Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar', 'Belonia',
        'Khowai', 'Ambassa', 'Ranir Bazar', 'Sonamura', 'Sabroom',
        'Kumarghat', 'Teliamura', 'Amarpur', 'Ranirbazar', 'Kamalpur'
    ],
    'Meghalaya': [
        'Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Baghmara', 'Williamnagar',
        'Nongpoh', 'Mairang', 'Resubelpara', 'Ampati', 'Cherrapunji', 'Mawlai'
    ],
    'Manipur': [
        'Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching',
        'Ukhrul', 'Senapati', 'Tamenglong', 'Jiribam', 'Moreh', 'Mayang Imphal',
        'Yairipok', 'Wangjing', 'Nambol', 'Moirang'
    ],
    'Nagaland': [
        'Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto',
        'Phek', 'Mon', 'Longleng', 'Kiphire', 'Peren', 'Chumukedima'
    ],
    'Mizoram': [
        'Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Lawngtlai',
        'Mamit', 'Saiha', 'Hnahthial', 'Saitual', 'Khawzawl'
    ],
    'Arunachal Pradesh': [
        'Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila',
        'Tezu', 'Seppa', 'Changlang', 'Namsai', 'Along', 'Roing', 'Anini',
        'Daporijo', 'Khonsa', 'Yingkiong'
    ],
    'Sikkim': [
        'Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Jorethang',
        'Singtam', 'Ravangla', 'Pelling', 'Yuksom'
    ],
    'Dadra and Nagar Haveli and Daman and Diu': [
        'Daman', 'Diu', 'Silvassa', 'Nani Daman', 'Moti Daman', 'Amli',
        'Khanvel', 'Samarvarni', 'Rakholi', 'Naroli'
    ],
    'Lakshadweep': [
        'Kavaratti', 'Agatti', 'Amini', 'Andrott', 'Kalpeni', 'Kadmat',
        'Kiltan', 'Chetlat', 'Bitra', 'Minicoy'
    ],
    'Andaman and Nicobar Islands': [
        'Port Blair', 'Diglipur', 'Rangat', 'Mayabunder', 'Bamboo Flat',
        'Garacharma', 'Hut Bay', 'Car Nicobar', 'Nancowry', 'Campbell Bay'
    ]
}
