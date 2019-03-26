# shopify export ALL orders to csv

paginate and appropriately rate limit requests to export orders from shopify because their GUI sucks, has a max of 9000 orders per export and uses email 🙄


install:
<br>
`npm install`
<br>
<br>
configure:
<br>
edit add shopify private app details to ".env.example" and save as ".env"
<br>
<br>
run:
<br>
`node main.js`
<br>
<br>
result:
<br>
a file will be created named "orders.csv"
<br>
<br>
enjoy 🌱
