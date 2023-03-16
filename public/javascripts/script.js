function addToCart(proId){
    $.ajax
        ({
            url:'/addToCart/'+proId,
            method:'get',
            success:(response)=>{
                if(response.status){

                    
              Toastify({
                text: "Item Added To Cart",
                duration: 3000,
                gravity: "bottom",
                position: "center",  
                style: {
                    background: '#FA8072',
                   
                },
            }).showToast();
                   
                    let count = $('#cart-count').html()
                    count = parseInt(count)+1
                    $('#cart-count').html(count)
                }
            }
        })
    }


